export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { mode, store, review } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ message: '서버 환경변수에 API Key가 설정되지 않았습니다.' });
  }

  let prompt = "";
  if (mode === 'reply') {
    prompt = `당신은 외식업 평판 관리 전문 AI 솔루션 '리뷰닥터(ReviewDoctor)'입니다.
매장 정보: ${store}
고객 리뷰: "${review}"

위 고객 리뷰의 불만 요인을 정확히 진단하고, 다른 잠재 고객이 보았을 때 매장의 신뢰도와 품격을 극대화할 수 있는 사장님 댓글 2종(버전1: 품격 있는 정중한 공식 답변, 버전2: 진정성 있는 케어형 답변)을 작성하세요.`;
  } else {
    prompt = `당신은 외식업 소상공인 권익 보호 전문 솔루션 '리뷰닥터(ReviewDoctor)'입니다.
매장 정보: ${store}
대상 리뷰: "${review}"

한국의 '정보통신망 이용촉진 및 정보보호 등에 관한 법률 제44조의2(정보의 삭제요청 등)'에 근거하여 배달 플랫폼 고객센터에 즉각 제출할 정식 [게시중단(블라인드) 요청서]를 작성하세요. 사실 왜곡 및 비방 표현을 명확히 지목하고 소상공인 영업권 보호 사유를 공문 규격으로 논리적으로 서술하세요.`;
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
      return res.status(500).json({ message: data.error.message });
    }

    const aiAnswer = data.candidates[0].content.parts[0].text;
    return res.status(200).json({ result: aiAnswer });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}