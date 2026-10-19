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
  if (/hình thang|diện tích hình thang/i.test(topic)) {
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
  } else if (/hình lập phương|khối lập phương/i.test(topic)) {
    kind = "cube";
    const volume = /thể tích|the tich/i.test(topic);
    explanation = volume ? "Thể tích hình lập phương bằng cạnh nhân với chính nó ba lần: V = a × a × a." : "Hình lập phương có 6 mặt là các hình vuông bằng nhau; các cạnh có độ dài bằng nhau.";
    steps = [
      {title:"Quan sát",text:"Nhận biết các mặt vuông, cạnh và đỉnh của hình lập phương."},
      {title:"Khám phá",text:volume ? "Đếm số khối đơn vị theo chiều dài, chiều rộng và chiều cao." : "Quan sát mô hình và kiểm tra các mặt, cạnh có đặc điểm gì."},
      {title:"Khái quát",text:volume ? "Tính thể tích bằng cạnh × cạnh × cạnh." : "Kết luận hình lập phương có 6 mặt vuông bằng nhau."}
    ];
    questions = [
      {q:"Hình lập phương có bao nhiêu mặt?",options:["4 mặt","6 mặt","8 mặt","12 mặt"],answer:1,why:"Hình lập phương có 6 mặt, mỗi mặt là một hình vuông."},
      {q:"Các cạnh của hình lập phương có đặc điểm gì?",options:["Đều bằng nhau","Có 2 cạnh bằng nhau","Chỉ có cạnh đáy bằng nhau","Không bằng nhau"],answer:0,why:"Tất cả các cạnh của hình lập phương có độ dài bằng nhau."},
      {q:volume ? "Công thức tính thể tích hình lập phương là gì?" : "Mỗi mặt của hình lập phương có dạng gì?",options:volume ? ["V = a × a","V = a × a × a","V = 6 × a","V = a + a + a"] : ["Hình tam giác","Hình chữ nhật bất kỳ","Hình vuông","Hình tròn"],answer:volume ? 1 : 2,why:volume ? "Thể tích bằng cạnh nhân cạnh rồi nhân cạnh lần thứ ba." : "Mỗi mặt của hình lập phương là một hình vuông."}
    ];
  } else if (/hình hộp chữ nhật|khối hộp chữ nhật/i.test(topic)) {
    kind = "cuboid";
    const volume = /thể tích|the tich/i.test(topic);
    explanation = volume ? "Thể tích hình hộp chữ nhật bằng chiều dài nhân chiều rộng rồi nhân chiều cao." : "Hình hộp chữ nhật có 6 mặt là hình chữ nhật; các mặt đối diện bằng nhau.";
    steps = [
      {title:"Quan sát",text:"Nhận biết chiều dài, chiều rộng và chiều cao của hình hộp chữ nhật."},
      {title:"Khám phá",text:volume ? "Đếm các khối đơn vị xếp theo từng lớp." : "Quan sát 6 mặt và các cặp mặt đối diện."},
      {title:"Khái quát",text:volume ? "V = dài × rộng × cao." : "Các mặt đối diện của hình hộp chữ nhật bằng nhau."}
    ];
    questions = [
      {q:"Hình hộp chữ nhật có bao nhiêu mặt?",options:["4 mặt","5 mặt","6 mặt","8 mặt"],answer:2,why:"Hình hộp chữ nhật có 6 mặt."},
      {q:"Thể tích hình hộp chữ nhật được tính bằng cách nào?",options:["Dài + rộng + cao","Dài × rộng × cao","Dài × rộng","(Dài + rộng) × 2"],answer:1,why:"Thể tích bằng chiều dài nhân chiều rộng nhân chiều cao."},
      {q:"Các mặt đối diện của hình hộp chữ nhật như thế nào?",options:["Luôn là hình tròn","Không liên quan nhau","Bằng nhau","Đều là hình vuông"],answer:2,why:"Mỗi cặp mặt đối diện của hình hộp chữ nhật bằng nhau."}
    ];
  } else if (subject === "math" && /số thập phân|hàng thập phân|phần mười|phần trăm/i.test(topic)) {
    kind = "decimal";
    explanation = "Quan sát giá trị các chữ số theo hàng và thử thay đổi số để thấy giá trị thay đổi.";
    steps = [
      {title:"Quan sát",text:"Xác định phần nguyên, dấu phẩy và các hàng thập phân."},
      {title:"Thao tác",text:"Thử thay đổi chữ số ở từng hàng và so sánh giá trị số."},
      {title:"Khái quát",text:"Đọc, viết và phân tích số thập phân theo giá trị từng hàng."}
    ];
    questions = [
      {q:"Trong số 3,45, chữ số 4 thuộc hàng nào?",options:["Hàng đơn vị","Hàng phần mười","Hàng phần trăm","Hàng chục"],answer:1,why:"Chữ số đầu tiên sau dấu phẩy thuộc hàng phần mười."},
      {q:"Số nào bằng 2 đơn vị và 6 phần mười?",options:["2,06","2,6","26","0,26"],answer:1,why:"Sáu phần mười được viết là 0,6 nên số cần tìm là 2,6."},
      {q:"Chữ số 7 trong số 5,72 có giá trị là bao nhiêu?",options:["7","0,7","0,07","70"],answer:1,why:"Chữ số 7 ở hàng phần mười có giá trị 0,7."}
    ];
  } else if (subject === "math" && /phân số|tử số|mẫu số|quy đồng/i.test(topic)) {
    kind = "fraction";
    explanation = "Phân số biểu thị một hay nhiều phần bằng nhau của một đơn vị.";
    steps = [
      {title:"Quan sát",text:"Chia đơn vị thành các phần bằng nhau và xác định số phần được lấy."},
      {title:"Thao tác",text:"Thử thay đổi tử số và mẫu số để so sánh phần được biểu thị."},
      {title:"Khái quát",text:"Tử số cho biết số phần lấy; mẫu số cho biết số phần bằng nhau của đơn vị."}
    ];
    questions = [
      {q:"Phân số 3/4 biểu thị điều gì?",options:["3 phần trong 4 phần bằng nhau","4 phần trong 3 phần","3 cộng 4","4 trừ 3"],answer:0,why:"Mẫu số 4 chỉ đơn vị chia thành 4 phần bằng nhau, tử số 3 chỉ lấy 3 phần."},
      {q:"Trong phân số 2/5, mẫu số là số nào?",options:["2","5","7","10"],answer:1,why:"Mẫu số là số ở dưới gạch phân số."},
      {q:"Phân số nào lớn hơn trong hai phân số 1/4 và 3/4?",options:["1/4","3/4","Bằng nhau","Không thể so sánh"],answer:1,why:"Hai phân số cùng mẫu số, phân số có tử số lớn hơn thì lớn hơn."}
    ];
  } else if (subject === "math" && /đường tròn|hình tròn|tam giác|hình chữ nhật|hình vuông|chu vi|diện tích/i.test(topic)) {
    kind = "geometry";
    explanation = "Quan sát hình, nhận biết các yếu tố hình học và liên hệ chúng với yêu cầu bài học.";
    steps = [
      {title:"Quan sát",text:"Nhận diện hình và các cạnh, đỉnh hoặc bán kính được thể hiện."},
      {title:"Thao tác",text:"So sánh độ dài, kích thước và đặc điểm của hình."},
      {title:"Vận dụng",text:"Dùng đặc điểm hình học để giải bài tập tương tự."}
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
  } else if ((subject === "science" || /nước|bay hơi|quang hợp|môi trường|năng lượng/i.test(topic)) && /vòng tuần hoàn nước|bay hơi|ngưng tụ|mưa|nước trong tự nhiên/i.test(topic)) {
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
  } else if (subject === "science" && /cây|thực vật|quang hợp|nảy mầm|sinh trưởng/i.test(topic)) {
    kind = "plant";
    explanation = "Thực vật cần điều kiện thích hợp để sinh trưởng; quan sát các bộ phận và nhu cầu sống của cây.";
    steps = [
      {title:"Quan sát",text:"Nhận biết rễ, thân, lá và các bộ phận được thể hiện."},
      {title:"Khám phá",text:"Tìm hiểu vai trò của ánh sáng, nước và không khí đối với cây."},
      {title:"Liên hệ",text:"Đề xuất cách chăm sóc cây phù hợp trong thực tế."}
    ];
  } else if (subject === "science" && /nam châm|từ tính|lực hút/i.test(topic)) {
    kind = "magnet";
    explanation = "Nam châm hút một số vật liệu nhất định; cần quan sát và thử nghiệm để phân biệt vật bị hút và không bị hút.";
    steps = [
      {title:"Dự đoán",text:"Dự đoán vật nào sẽ bị nam châm hút."},
      {title:"Thử nghiệm",text:"Đưa nam châm lại gần từng vật và quan sát kết quả."},
      {title:"Kết luận",text:"Phân nhóm vật theo kết quả thử nghiệm."}
    ];
  } else if (subject === "science" && /mặt trời|hệ mặt trời|hành tinh|trái đất|ngày và đêm/i.test(topic)) {
    kind = "solar";
    explanation = "Quan sát vị trí tương đối và chuyển động của các thiên thể để tìm hiểu hiện tượng.";
    steps = [
      {title:"Quan sát",text:"Nhận diện Mặt Trời, Trái Đất và các vị trí được mô phỏng."},
      {title:"Khám phá",text:"Theo dõi vị trí tương đối và nêu điều em nhận thấy."},
      {title:"Vận dụng",text:"Giải thích hiện tượng bằng mô hình vừa quan sát."}
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
  const prompt = `Bạn là chuyên gia thiết kế mô phỏng dạy học tiểu học Việt Nam. Tạo kịch bản mô phỏng ngắn, đúng lứa tuổi, về chủ đề: ${topic}. Môn: ${subject}; lớp: ${grade}. Trả về CHỈ JSON hợp lệ theo schema {"title":string,"subject":string,"grade":string,"kind":"trapezoid"|"sentence"|"water"|"decimal"|"fraction"|"geometry"|"plant"|"magnet"|"solar"|"cube"|"cuboid"|"triangle"|"rectangle"|"square"|"parallelogram"|"explore","explanation":string,"steps":[{"title":string,"text":string}],"questions":[{"q":string,"options":[string,string,string,string],"answer":number,"why":string}]}. Có 3 bước và 3 câu hỏi, đáp án answer là chỉ số 0-3. Không bịa nội dung sách cụ thể.`;
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
  // Chọn loại hình minh họa theo chủ đề người dùng nhập, không phụ thuộc hoàn toàn vào dự đoán của AI.
  const topicKey = topic.toLocaleLowerCase("vi");
  if (/hình thang|diện tích hình thang/.test(topicKey)) plan.kind = "trapezoid";
  else if (/hình lập phương|khối lập phương/.test(topicKey)) plan.kind = "cube";
  else if (/hình hộp chữ nhật|khối hộp chữ nhật/.test(topicKey)) plan.kind = "cuboid";
  else if (/tam giác/.test(topicKey)) plan.kind = "triangle";
  else if (/hình chữ nhật/.test(topicKey)) plan.kind = "rectangle";
  else if (/hình vuông/.test(topicKey)) plan.kind = "square";
  else if (/hình bình hành/.test(topicKey)) plan.kind = "parallelogram";
  else if (/số thập phân|hàng thập phân|phần mười|phần trăm/.test(topicKey)) plan.kind = "decimal";
  else if (/phân số|tử số|mẫu số|quy đồng/.test(topicKey)) plan.kind = "fraction";
  else if (/chủ ngữ|vị ngữ|trạng ngữ|từ đồng nghĩa|nhân hóa|câu ghép/.test(topicKey) || subject === "vietnamese") plan.kind = "sentence";
  else if (/vòng tuần hoàn nước|bay hơi|ngưng tụ|mưa|nước trong tự nhiên/.test(topicKey)) plan.kind = "water";
  else if (/cây|thực vật|quang hợp|nảy mầm|sinh trưởng/.test(topicKey)) plan.kind = "plant";
  else if (/nam châm|từ tính|lực hút/.test(topicKey)) plan.kind = "magnet";
  else if (/mặt trời|hệ mặt trời|hành tinh|trái đất|ngày và đêm/.test(topicKey)) plan.kind = "solar";
  else if (/đường tròn|hình tròn|tam giác|hình chữ nhật|hình vuông|chu vi|diện tích/.test(topicKey)) plan.kind = "geometry";
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
