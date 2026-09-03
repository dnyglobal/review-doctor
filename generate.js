export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { mode, store, review } = req.body || {};
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ message: 'Vercel 환경변수에 GEMINI_API_KEY가 등록되지 않았거나 Redeploy 되지 않았습니다.' });
  }

  let prompt = "";
  if (mode === 'reply') {
    prompt = `당신은 외식업 평판 관리 전문 AI 솔루션 '리뷰닥터(ReviewDoctor)'입니다.
매장 정보: ${store || '일반 음식점'}
고객 리뷰: "${review}"

위 리뷰를 분석하여 다른 고객이 보았을 때 매장의 품격과 신뢰가 올라가는 사장님 댓글 2종(버전1: 정중한 공식 답변, 버전2: 진정성 있는 케어형 답변)을 한국어로 작성하세요.`;
  } else {
    prompt = `당신은 외식업 소상공인 권익 보호 전문 솔루션 '리뷰닥터(ReviewDoctor)'입니다.
매장 정보: ${store || '일반 음식점'}
대상 리뷰: "${review}"

한국의 '정보통신망 이용촉진 및 정보보호 등에 관한 법률 제44조의2'에 근거하여 플랫폼 고객센터에 제출할 정식 [게시중단(블라인드) 요청서]를 한국어 공문 서식으로 작성하세요.`;
  }

  try {
    const apiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        safetySettings: [
          { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
        ]
      })
    });

    const data = await apiRes.json();
    if (data.error) {
      return res.status(500).json({ message: "Google API 거부: " + data.error.message });
    }

    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      return res.status(500).json({ message: "답변이 비어있습니다. 다시 시도해 주세요." });
    }

    const aiAnswer = data.candidates[0].content.parts[0].text;
    return res.status(200).json({ result: aiAnswer });
  } catch (error) {
    return res.status(500).json({ message: "서버 예외: " + error.message });
  }
}