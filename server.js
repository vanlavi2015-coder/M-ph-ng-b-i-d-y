const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 3000;
const ROOT = path.join(__dirname, "public");
const TYPES = new Set(["math", "vietnamese", "science", "general"]);

function send(res, status, body, type = "application/json; charset=utf-8") {
  res.writeHead(status, {"Content-Type": type, "X-Content-Type-Options":"nosniff"});
  res.end(body);
}
function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", chunk => { data += chunk; if (data.length > 200000) reject(new Error("Yêu cầu quá lớn")); });
    req.on("end", () => { try { resolve(JSON.parse(data || "{}")); } catch(e) { reject(e); } });
    req.on("error", reject);
  });
}
function fallbackPlan(input) {
  const topic = String(input.topic || "Bài học lớp 5").slice(0,160);
  const subject = TYPES.has(input.subject) ? input.subject : "general";
  const grade = String(input.grade || "5").slice(0,10);
  let kind = "explore";
  let title = topic;
  let explanation = "Học sinh quan sát, dự đoán, thao tác với mô hình và rút ra nhận xét.";
  let steps = [
    {title:"Khởi động", text:"Quan sát mô hình và nêu dự đoán trước khi thao tác."},
    {title:"Khám phá", text:"Thử thay đổi các thông số, so sánh kết quả và giải thích."},
    {title:"Luyện tập", text:"Trả lời câu hỏi kiểm tra nhanh, sau đó tự đánh giá."}
  ];
  let questions = [
    {q:"Em hãy nêu điều em quan sát được.", options:["Có sự thay đổi","Không có gì thay đổi","Chưa đủ dữ kiện","Cần thử lại"], answer:0, why:"Quan sát và kiểm tra bằng thao tác giúp kiểm chứng dự đoán."},
    {q:"Bước nào nên làm trước khi thao tác?", options:["Dự đoán","Chép đáp án","Bỏ qua quan sát","Kết luận ngay"], answer:0, why:"Dự đoán giúp học sinh so sánh ý tưởng ban đầu với kết quả."},
    {q:"Sau khi thử nghiệm, em nên làm gì?", options:["Rút ra nhận xét","Xóa kết quả","Không trao đổi","Đoán lại mà không kiểm tra"], answer:0, why:"Kết luận cần dựa trên bằng chứng quan sát được."}
  ];
  if (subject === "math" || /hình thang|diện tích/i.test(topic)) {
    kind = "trapezoid";
    explanation = "Diện tích hình thang bằng tổng độ dài hai đáy nhân với chiều cao rồi chia cho 2.";
    steps = [
      {title:"Quan sát",text:"Xác định đáy lớn, đáy bé và chiều cao của hình thang."},
      {title:"Thao tác",text:"Kéo thanh trượt để thay đổi hai đáy và chiều cao; quan sát diện tích thay đổi."},
      {title:"Khái quát",text:"Từ kết quả, rút ra công thức S = (a + b) × h ÷ 2."}
    ];
    questions = [
      {q:"Hình thang có hai đáy 8 cm và 12 cm, chiều cao 5 cm. Diện tích là bao nhiêu?",options:["40 cm²","50 cm²","60 cm²","100 cm²"],answer:1,why:"S = (8 + 12) × 5 ÷ 2 = 50 cm²."},
      {q:"Nếu chiều cao tăng gấp đôi, hai đáy không đổi thì diện tích thế nào?",options:["Giảm một nửa","Không đổi","Tăng gấp đôi","Tăng gấp ba"],answer:2,why:"Diện tích tỉ lệ thuận với chiều cao khi hai đáy không đổi."},
      {q:"Công thức diện tích hình thang là gì?",options:["S = a × b","S = (a + b) × h ÷ 2","S = (a + b) × 2","S = a × h"],answer:1,why:"Lấy tổng hai đáy nhân chiều cao rồi chia 2."}
    ];
  } else if (subject === "vietnamese" || /từ đồng nghĩa|nhân hóa|chủ ngữ|vị ngữ|trạng ngữ|câu ghép/i.test(topic)) {
    kind = "sentence";
    explanation = "Quan sát câu mẫu, chọn thành phần/từ ngữ cần tìm và giải thích căn cứ lựa chọn.";
    steps = [
      {title:"Đọc câu",text:"Đọc chậm câu ví dụ và xác định nội dung chính."},
      {title:"Phân tích",text:"Chọn từ hoặc bộ phận câu theo yêu cầu; đối chiếu với câu hỏi."},
      {title:"Vận dụng",text:"Tự đặt một câu mới và giải thích cách dùng từ hoặc cấu tạo câu."}
    ];
    questions = [
      {q:"Trong câu “Những chú chim hót líu lo trên cành”, chủ ngữ là gì?",options:["Những chú chim","hót líu lo","trên cành","líu lo trên cành"],answer:0,why:"Chủ ngữ trả lời câu hỏi Ai? Cái gì? Con gì?"},
      {q:"Câu nào có sử dụng biện pháp nhân hóa?",options:["Mặt hồ rất rộng.","Chị gió khẽ gõ cửa sổ.","Bầu trời xanh.","Em đọc sách."],answer:1,why:"Gọi gió là “chị” và gán hành động như con người là nhân hóa."},
      {q:"Từ nào gần nghĩa với “chăm chỉ”?",options:["Lười biếng","Siêng năng","Vội vàng","Mệt mỏi"],answer:1,why:"“Siêng năng” có nghĩa gần với “chăm chỉ”."}
    ];
  } else if (subject === "science" || /nước|bay hơi|quang hợp|môi trường|năng lượng/i.test(topic)) {
    kind = "water";
    explanation = "Quan sát quá trình, mô tả điều kiện làm thay đổi hiện tượng và liên hệ thực tế.";
    steps = [
      {title:"Dự đoán",text:"Nêu dự đoán về điều xảy ra khi điều kiện môi trường thay đổi."},
      {title:"Quan sát",text:"Theo dõi mô hình và mô tả các giai đoạn theo thứ tự."},
      {title:"Liên hệ",text:"Tìm ví dụ tương tự trong đời sống và nêu cách vận dụng."}
    ];
    questions = [
      {q:"Nước chuyển từ thể lỏng sang thể khí gọi là gì?",options:["Đông đặc","Bay hơi","Nóng chảy","Ngưng tụ"],answer:1,why:"Bay hơi là quá trình chuyển từ thể lỏng sang thể khí."},
      {q:"Điều nào thường làm nước bay hơi nhanh hơn?",options:["Nhiệt độ cao hơn","Để trong ngăn đá","Giảm diện tích mặt thoáng","Không khí lạnh hơn"],answer:0,why:"Nhiệt độ cao thường làm tốc độ bay hơi tăng."},
      {q:"Hơi nước gặp lạnh có thể chuyển thành gì?",options:["Đá ngay lập tức","Giọt nước do ngưng tụ","Đất","Muối"],answer:1,why:"Ngưng tụ là quá trình hơi nước chuyển thành các giọt nước."}
    ];
  }
  return {title,subject,grade,kind,explanation,steps,questions,source:"demo"};
}
async function generate(input) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return fallbackPlan(input);
  const topic = String(input.topic || "").slice(0,160);
  const subject = String(input.subject || "general");
  const grade = String(input.grade || "5");
  const prompt = `Bạn là chuyên gia thiết kế mô phỏng dạy học tiểu học Việt Nam. Tạo kịch bản mô phỏng ngắn, đúng lứa tuổi, về chủ đề: ${topic}. Môn: ${subject}; lớp: ${grade}. Trả về CHỈ JSON hợp lệ theo schema {"title":string,"subject":string,"grade":string,"kind":"trapezoid"|"sentence"|"water"|"explore","explanation":string,"steps":[{"title":string,"text":string}],"questions":[{"q":string,"options":[string,string,string,string],"answer":number,"why":string}]}. Có 3 bước và 3 câu hỏi, đáp án answer là chỉ số 0-3. Không bịa nội dung sách cụ thể.`;
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method:"POST",
    headers:{"Authorization":`Bearer ${key}`,"Content-Type":"application/json"},
    body:JSON.stringify({model:process.env.OPENAI_MODEL || "gpt-4o-mini",temperature:0.4,messages:[{role:"system",content:"Chỉ trả JSON hợp lệ, không Markdown."},{role:"user",content:prompt}]})
  });
  if (!response.ok) throw new Error("AI chưa tạo được mô phỏng. Kiểm tra OPENAI_API_KEY trên máy chủ.");
  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || "";
  const plan = JSON.parse(content.replace(/^```json\s*/i,"").replace(/```$/,"").trim());
  if (!Array.isArray(plan.steps) || !Array.isArray(plan.questions)) throw new Error("Dữ liệu AI trả về chưa đúng định dạng.");
  plan.source = "ai";
  return plan;
}
const server = http.createServer(async (req,res) => {
  if (req.url === "/api/health") return send(res,200,JSON.stringify({ok:true,app:"Mo phong bai day"}));
  if (req.url === "/api/generate" && req.method === "POST") {
    try {
      const input = await readBody(req);
      if (!String(input.topic || "").trim()) return send(res,400,JSON.stringify({error:"Cô hãy nhập tên bài học hoặc nội dung cần mô phỏng."}));
      const plan = await generate(input);
      return send(res,200,JSON.stringify(plan));
    } catch (e) { return send(res,500,JSON.stringify({error:e.message || "Có lỗi khi tạo mô phỏng."})); }
  }
  const pathname = decodeURIComponent((req.url || "/").split("?")[0]);
  const target = path.join(ROOT, pathname === "/" ? "index.html" : pathname.replace(/^\/+/,""));
  if (!target.startsWith(ROOT)) return send(res,403,"Không được phép");
  fs.readFile(target,(err,buf) => {
    if (err) return send(res,404,"Không tìm thấy trang","text/plain; charset=utf-8");
    const ext = path.extname(target);
    const type = ext === ".html" ? "text/html; charset=utf-8" : ext === ".css" ? "text/css; charset=utf-8" : ext === ".js" ? "text/javascript; charset=utf-8" : "application/octet-stream";
    send(res,200,buf,type);
  });
});
server.listen(PORT,()=>console.log(`Mo phong bai day dang chay tai cong ${PORT}`));
