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
  } else if (subject === "math" && /(?:cộng|trừ|nhân|chia|phép tính).{0,35}số thập phân|số thập phân.{0,35}(?:cộng|trừ|nhân|chia|phép tính)/i.test(topic)) {
    kind = "arithmetic";
    explanation = "Thực hiện phép tính với số thập phân, đặt các dấu phẩy thẳng cột khi cộng hoặc trừ và kiểm tra kết quả bằng ước lượng.";
    steps = [
      {title:"Đọc phép tính",text:"Xác định phép tính và các số thập phân đã cho."},
      {title:"Thực hiện",text:"Chú ý giá trị các hàng và dấu phẩy thập phân; với phép chia, kiểm tra số chia khác 0."},
      {title:"Kiểm tra",text:"Ước lượng hoặc dùng phép tính ngược để kiểm tra kết quả."}
    ];
    questions = /trừ/i.test(topic) ? [
      {q:"Tính 8,2 − 3,7.",options:["4,5","5,5","4,7","11,9"],answer:0,why:"8,2 − 3,7 = 4,5."},
      {q:"Khi trừ hai số thập phân, cần đặt thế nào?",options:["Dấu phẩy thẳng cột","Dấu phẩy tùy ý","Bỏ dấu phẩy","Viết ngược số"],answer:0,why:"Đặt các dấu phẩy thẳng cột để các hàng tương ứng thẳng nhau."},
      {q:"Tính 5,0 − 1,6.",options:["3,4","4,4","3,6","6,6"],answer:0,why:"5,0 − 1,6 = 3,4."}
    ] : /nhân/i.test(topic) ? [
      {q:"Tính 2,4 × 3.",options:["0,72","7,2","72","5,4"],answer:1,why:"2,4 × 3 = 7,2."},
      {q:"Tính 0,5 × 8.",options:["4","0,4","40","8,5"],answer:0,why:"0,5 × 8 = 4."},
      {q:"Sau khi nhân số thập phân, cần làm gì?",options:["Kiểm tra vị trí dấu phẩy","Bỏ dấu phẩy","Đổi phép nhân thành cộng","Không cần kiểm tra"],answer:0,why:"Cần kiểm tra giá trị hàng và vị trí dấu phẩy."}
    ] : /chia/i.test(topic) ? [
      {q:"Tính 7,2 ÷ 3.",options:["2,4","24","4,2","0,24"],answer:0,why:"7,2 ÷ 3 = 2,4."},
      {q:"Tính 4,8 ÷ 2.",options:["2,4","24","2,8","0,24"],answer:0,why:"4,8 ÷ 2 = 2,4."},
      {q:"Số chia trong phép chia phải khác số nào?",options:["0","1","2","10"],answer:0,why:"Không thể thực hiện phép chia cho 0."}
    ] : [
      {q:"Tính 3,6 + 1,4.",options:["4","5","4,10","5,1"],answer:1,why:"3,6 + 1,4 = 5,0 = 5."},
      {q:"Khi cộng số thập phân, cần đặt thế nào?",options:["Dấu phẩy thẳng cột","Các chữ số tùy ý","Bỏ dấu phẩy","Viết ngược số"],answer:0,why:"Đặt dấu phẩy thẳng cột để cộng các hàng tương ứng."},
      {q:"Tính 2,35 + 1,4.",options:["3,75","2,49","3,39","3,65"],answer:0,why:"2,35 + 1,40 = 3,75."}
    ];
  } else if (subject === "math" && /số thập phân|hàng thập phân|phần mười|làm tròn số thập phân|so sánh các số thập phân/i.test(topic)) {
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
  } else if (subject === "math" && /hình tam giác|tam giác|diện tích tam giác/i.test(topic)) {
    const areaLesson = /diện tích/.test(topic);
    kind = "triangle";
    explanation = areaLesson
      ? "Diện tích hình tam giác bằng độ dài đáy nhân với chiều cao tương ứng rồi chia cho 2: S = a × h ÷ 2. Đáy và chiều cao phải cùng đơn vị đo."
      : "Hình tam giác có 3 cạnh, 3 đỉnh, 3 góc. Các dạng thường gặp: tam giác nhọn, tam giác vuông, tam giác tù và tam giác đều. Đường cao kẻ từ một đỉnh và vuông góc với đáy tương ứng.";
    steps = areaLesson ? [
      {title:"Ôn lại",text:"Xác định đáy a và chiều cao h tương ứng; đường cao phải vuông góc với đáy."},
      {title:"Khám phá",text:"Ghép hai hình tam giác bằng nhau để tạo thành hình bình hành có đáy a và chiều cao h; diện tích hình ghép gấp đôi diện tích một tam giác."},
      {title:"Rút ra công thức",text:"S hình tam giác = (a × h) ÷ 2. Đổi đáy và chiều cao về cùng đơn vị trước khi tính."}
    ] : [
      {title:"Quan sát",text:"Nhận biết 3 cạnh, 3 đỉnh và 3 góc của hình tam giác."},
      {title:"Phân loại",text:"So sánh góc và cạnh để nhận biết tam giác nhọn, vuông, tù và tam giác đều."},
      {title:"Xác định đường cao",text:"Chỉ ra đáy, đường cao vuông góc với đáy và chiều cao tương ứng."}
    ];
    questions = areaLesson ? [
      {q:"Tam giác có đáy 4 cm và chiều cao tương ứng 3 cm. Diện tích là bao nhiêu?",options:["12 cm²","6 cm²","7 cm²","24 cm²"],answer:1,why:"S = 4 × 3 ÷ 2 = 6 cm²."},
      {q:"Đáy là 2 dm, chiều cao là 20 cm. Em cần làm gì trước khi tính?",options:["Cộng hai số đo","Đổi về cùng đơn vị đo","Nhân rồi cộng 2","Không cần kiểm tra đơn vị"],answer:1,why:"Đổi 2 dm = 20 cm, sau đó S = 20 × 20 ÷ 2 = 200 cm² = 2 dm²."},
      {q:"Công thức tính diện tích hình tam giác là gì?",options:["S = a × h","S = (a + h) × 2","S = a × h ÷ 2","S = a + h ÷ 2"],answer:2,why:"Diện tích hình tam giác bằng đáy nhân chiều cao tương ứng rồi chia 2."}
    ] : [
      {q:"Hình tam giác có bao nhiêu cạnh, đỉnh và góc?",options:["2 cạnh, 3 đỉnh, 3 góc","3 cạnh, 3 đỉnh, 3 góc","4 cạnh, 4 đỉnh, 4 góc","3 cạnh, 2 đỉnh, 3 góc"],answer:1,why:"Mọi hình tam giác đều có 3 cạnh, 3 đỉnh và 3 góc."},
      {q:"Đường cao ứng với một đáy của tam giác phải như thế nào?",options:["Song song với đáy","Bằng đáy","Vuông góc với đáy","Luôn nằm ngoài tam giác"],answer:2,why:"Đường cao là đoạn thẳng kẻ từ một đỉnh và vuông góc với đáy tương ứng."},
      {q:"Tam giác có một góc vuông gọi là gì?",options:["Tam giác nhọn","Tam giác tù","Tam giác đều","Tam giác vuông"],answer:3,why:"Tam giác có một góc vuông là tam giác vuông."}
    ];
  } else if (subject === "math" && /đường tròn|hình tròn|chu vi hình tròn|diện tích hình tròn/i.test(topic)) {
    kind = "circle";
    const area = /diện tích/.test(topic);
    explanation = area ? "Diện tích hình tròn được tính bằng bán kính nhân bán kính rồi nhân với 3,14: S = r × r × 3,14." : "Chu vi hình tròn bằng đường kính nhân 3,14 hoặc bán kính nhân 2 rồi nhân 3,14.";
    steps = [
      {title:"Quan sát",text:"Xác định tâm, bán kính r và đường kính d của hình tròn."},
      {title:"Thao tác",text:"Thay đổi bán kính để quan sát chu vi hoặc diện tích thay đổi."},
      {title:"Khái quát",text:area ? "Rút ra S = r × r × 3,14." : "Rút ra C = d × 3,14 = 2 × r × 3,14."}
    ];
    questions = [
      {q:"Đường kính hình tròn bằng bao nhiêu lần bán kính?",options:["1 lần","2 lần","3 lần","4 lần"],answer:1,why:"Đường kính bằng hai lần bán kính."},
      {q:area ? "Bán kính hình tròn 2 cm, lấy π ≈ 3,14. Diện tích là?" : "Đường kính hình tròn 10 cm, lấy π ≈ 3,14. Chu vi là?",options:area ? ["6,28 cm²","12,56 cm²","4 cm²","8 cm²"] : ["15,7 cm","31,4 cm","20 cm","10 cm"],answer:area ? 1 : 1,why:area ? "S = 2 × 2 × 3,14 = 12,56 cm²." : "C = 10 × 3,14 = 31,4 cm."},
      {q:"Tâm hình tròn là điểm nào?",options:["Điểm trên đường tròn","Điểm cách đều mọi điểm trên đường tròn","Điểm cuối của đường kính","Một điểm bất kỳ bên ngoài"],answer:1,why:"Tâm cách đều mọi điểm trên đường tròn."}
    ];
  } else if (subject === "math" && /hình bình hành/i.test(topic)) {
    kind = "parallelogram";
    explanation = /diện tích/.test(topic) ? "Diện tích hình bình hành bằng độ dài đáy nhân với chiều cao tương ứng: S = a × h." : "Hình bình hành có hai cặp cạnh đối diện song song và bằng nhau.";
    steps = [
      {title:"Quan sát",text:"Nhận biết hai cặp cạnh đối diện song song."},
      {title:"Khám phá",text:"Cắt ghép phần tam giác ở một bên để tạo thành hình chữ nhật có cùng đáy và chiều cao."},
      {title:"Khái quát",text:/diện tích/.test(topic) ? "Diện tích hình bình hành bằng đáy nhân chiều cao tương ứng." : "Các cạnh đối diện song song và bằng nhau."}
    ];
    questions = [
      {q:"Hình bình hành có mấy cặp cạnh đối diện song song?",options:["1 cặp","2 cặp","3 cặp","Không có"],answer:1,why:"Hình bình hành có hai cặp cạnh đối diện song song."},
      {q:"Đáy 8 cm, chiều cao tương ứng 4 cm. Diện tích là?",options:["12 cm²","24 cm²","32 cm²","64 cm²"],answer:2,why:"S = 8 × 4 = 32 cm²."},
      {q:"Chiều cao của hình bình hành phải như thế nào với đáy?",options:["Song song","Vuông góc","Bằng đáy","Luôn dài hơn đáy"],answer:1,why:"Chiều cao là khoảng cách vuông góc giữa hai đáy song song."}
    ];
  } else if (subject === "math" && /tỉ số phần trăm|tỉ số|phần trăm|giá trị phần trăm/i.test(topic)) {
    kind = "percent";
    explanation = "Tỉ số phần trăm cho biết tỉ số của hai số tính theo phần trăm; 1% = 1/100.";
    steps = [
      {title:"Biểu diễn",text:"Chia toàn bộ thành 100 phần bằng nhau."},
      {title:"Thao tác",text:"Tô số phần tương ứng với tỉ lệ phần trăm."},
      {title:"Vận dụng",text:"Tìm tỉ số phần trăm hoặc giá trị phần trăm trong tình huống thực tế."}
    ];
    questions = [
      {q:"25% bằng phân số nào?",options:["25/10","25/100","1/25","100/25"],answer:1,why:"Phần trăm nghĩa là trên 100."},
      {q:"10% của 200 là bao nhiêu?",options:["2","10","20","100"],answer:2,why:"200 × 10 ÷ 100 = 20."},
      {q:"Lớp có 20 học sinh, 5 bạn đi xe đạp. Tỉ lệ là bao nhiêu?",options:["5%","20%","25%","50%"],answer:2,why:"5/20 × 100% = 25%."}
    ];
  } else if (subject === "math" && /thể tích|xăng-ti-mét khối|đề-xi-mét khối|mét khối/i.test(topic)) {
    kind = "volume";
    explanation = "Thể tích cho biết phần không gian mà một hình khối chiếm chỗ; có thể đếm bằng các khối đơn vị.";
    steps = [
      {title:"Quan sát",text:"Quan sát khối và các khối đơn vị dùng để lấp đầy."},
      {title:"Thao tác",text:"Đếm số khối theo chiều dài, chiều rộng và chiều cao hoặc theo từng lớp."},
      {title:"Khái quát",text:"Nêu thể tích bằng số khối đơn vị; liên hệ cm³, dm³ và m³."}
    ];
    questions = [
      {q:"Thể tích cho biết điều gì?",options:["Diện tích mặt ngoài","Phần không gian hình chiếm chỗ","Độ dài cạnh","Số mặt"],answer:1,why:"Thể tích đo phần không gian mà vật chiếm chỗ."},
      {q:"1 dm³ bằng bao nhiêu cm³?",options:["10 cm³","100 cm³","1000 cm³","10 000 cm³"],answer:2,why:"1 dm = 10 cm nên 1 dm³ = 10 × 10 × 10 = 1000 cm³."},
      {q:"Một khối hộp có 2 lớp, mỗi lớp 12 khối đơn vị. Có tất cả bao nhiêu khối?",options:["10","12","14","24"],answer:3,why:"2 × 12 = 24 khối đơn vị."}
    ];
  } else if (subject === "math" && /đơn vị đo diện tích|ki-lô-mét vuông|héc-ta|đo lường|đổi đơn vị/i.test(topic)) {
    kind = "units";
    explanation = "Khi đổi đơn vị đo, cần dựa vào quan hệ giữa các đơn vị và ghi đúng đơn vị của kết quả.";
    steps = [
      {title:"Nhận biết",text:"Xác định đơn vị đo đang dùng và đơn vị cần đổi."},
      {title:"Thực hiện",text:"Dùng bảng đơn vị hoặc quan hệ quy đổi để đổi số đo."},
      {title:"Kiểm tra",text:"Ước lượng kết quả và ghi đúng đơn vị."}
    ];
    const areaUnits = /diện tích|héc-ta|ki-lô-mét vuông|km²|m²/i.test(topic);
    const massUnits = /khối lượng|ki-lô-gam|gam|tấn|yến|tạ/i.test(topic);
    const timeUnits = /thời gian|giờ|phút|giây|ngày|tháng|năm/i.test(topic);
    questions = areaUnits ? [
      {q:"1 ha bằng bao nhiêu m²?",options:["100 m²","1000 m²","10 000 m²","100 000 m²"],answer:2,why:"1 ha = 10 000 m²."},
      {q:"1 km² bằng bao nhiêu ha?",options:["10 ha","100 ha","1000 ha","10 000 ha"],answer:1,why:"1 km² = 100 ha."},
      {q:"Các đơn vị diện tích liền kề hơn kém nhau bao nhiêu lần?",options:["2 lần","10 lần","100 lần","1000 lần"],answer:2,why:"Các đơn vị diện tích liền kề hơn kém nhau 100 lần."}
    ] : massUnits ? [
      {q:"1 kg bằng bao nhiêu gam?",options:["10 g","100 g","1000 g","10 000 g"],answer:2,why:"1 kg = 1000 g."},
      {q:"3,5 kg bằng bao nhiêu gam?",options:["350 g","3500 g","35 000 g","3050 g"],answer:1,why:"3,5 kg = 3500 g."},
      {q:"2 tấn bằng bao nhiêu kg?",options:["200 kg","2000 kg","20 000 kg","20 kg"],answer:1,why:"1 tấn = 1000 kg, nên 2 tấn = 2000 kg."}
    ] : timeUnits ? [
      {q:"1 giờ bằng bao nhiêu phút?",options:["30 phút","60 phút","100 phút","24 phút"],answer:1,why:"1 giờ = 60 phút."},
      {q:"2 giờ 30 phút bằng bao nhiêu phút?",options:["120 phút","130 phút","150 phút","230 phút"],answer:2,why:"2 × 60 + 30 = 150 phút."},
      {q:"1 ngày có bao nhiêu giờ?",options:["12 giờ","24 giờ","60 giờ","100 giờ"],answer:1,why:"1 ngày = 24 giờ."}
    ] : [
      {q:"1 m bằng bao nhiêu cm?",options:["10 cm","100 cm","1000 cm","10 000 cm"],answer:1,why:"1 m = 100 cm."},
      {q:"2,5 m bằng bao nhiêu cm?",options:["25 cm","250 cm","2500 cm","205 cm"],answer:1,why:"2,5 × 100 = 250 cm."},
      {q:"Các đơn vị độ dài liền kề hơn kém nhau bao nhiêu lần?",options:["2 lần","5 lần","10 lần","100 lần"],answer:2,why:"Các đơn vị độ dài liền kề hơn kém nhau 10 lần."}
    ];
  } else if (subject === "math" && /tỉ lệ bản đồ|bản đồ|tìm hai số khi biết tổng|tìm hai số khi biết hiệu/i.test(topic)) {
    kind = "ratio";
    explanation = "Dùng sơ đồ đoạn thẳng hoặc các phần bằng nhau để biểu diễn tỉ lệ và tìm giá trị từng phần.";
    steps = [
      {title:"Tóm tắt",text:"Xác định tổng hoặc hiệu và tỉ số đã cho."},
      {title:"Biểu diễn",text:"Vẽ sơ đồ các phần bằng nhau theo tỉ số."},
      {title:"Giải toán",text:"Tìm giá trị một phần rồi suy ra các số cần tìm."}
    ];
    questions = [
      {q:"Tỉ số 2 : 3 nghĩa là gì?",options:["Hai số hơn kém nhau 3","Số thứ nhất 2 phần, số thứ hai 3 phần","Tổng bằng 5","Hiệu bằng 1"],answer:1,why:"Tỉ số 2 : 3 biểu diễn hai số bằng 2 phần và 3 phần cùng loại."},
      {q:"Tổng hai số là 25, tỉ số 2 : 3. Số bé là?",options:["5","10","15","20"],answer:1,why:"Tổng phần 2+3=5; mỗi phần 25÷5=5; số bé 2×5=10."},
      {q:"Trên bản đồ 1 cm ứng với 1 km ngoài thực tế. 3 cm ứng với?",options:["300 m","1 km","3 km","30 km"],answer:2,why:"3 cm trên bản đồ ứng với 3 km ngoài thực tế."}
    ];
  } else if (subject === "math" && /số tự nhiên|phép tính với số tự nhiên|cộng số thập phân|trừ số thập phân|nhân số thập phân|chia số thập phân|phép tính|làm tròn số thập phân|so sánh các số thập phân|phép cộng|phép trừ|phép nhân|phép chia|cộng trừ|nhân chia|tính nhẩm|tính giá trị biểu thức|thứ tự thực hiện phép tính|ước lượng kết quả|tính toán/i.test(topic)) {
    kind = /thập phân/.test(topic) ? "decimal" : "arithmetic";
    explanation = "Thực hiện phép tính theo đúng thứ tự, đặt tính thẳng hàng khi cần và kiểm tra kết quả bằng phép tính ngược hoặc ước lượng.";
    steps = [
      {title:"Đọc đề",text:"Xác định phép tính và dữ kiện đã cho."},
      {title:"Thực hiện",text:"Làm từng bước, chú ý giá trị hàng và dấu phẩy thập phân nếu có."},
      {title:"Kiểm tra",text:"Ước lượng hoặc dùng phép tính ngược để kiểm tra kết quả."}
    ];
    if (/phép trừ|trừ số|hiệu/i.test(topic)) {
      questions = [
        {q:"Tính 52 − 28.",options:["24","34","30","26"],answer:0,why:"52 − 28 = 24."},
        {q:"Phép trừ có thể kiểm tra bằng phép tính nào?",options:["Cộng","Chia","Nhân đôi","Không thể kiểm tra"],answer:0,why:"Lấy hiệu cộng với số trừ sẽ được số bị trừ."},
        {q:"Tính 8,2 − 3,7.",options:["4,5","5,5","4,7","11,9"],answer:0,why:"8,2 − 3,7 = 4,5; cần đặt dấu phẩy thẳng cột."}
      ];
    } else if (/phép nhân|nhân số|tích/i.test(topic)) {
      questions = [
        {q:"Tính 24 × 3.",options:["62","72","82","27"],answer:1,why:"24 × 3 = 72."},
        {q:"Nhân một số với 10 thì giá trị số thay đổi thế nào?",options:["Gấp 10 lần","Giảm 10 lần","Không đổi","Luôn bằng 10"],answer:0,why:"Nhân với 10 làm giá trị số gấp 10 lần."},
        {q:"Tính 2,4 × 3.",options:["0,72","7,2","72","5,4"],answer:1,why:"2,4 × 3 = 7,2."}
      ];
    } else if (/phép chia|chia số|thương/i.test(topic)) {
      questions = [
        {q:"Tính 84 ÷ 4.",options:["20","21","24","18"],answer:1,why:"84 ÷ 4 = 21."},
        {q:"Phép chia có thể kiểm tra bằng cách nào?",options:["Cộng số chia","Nhân thương với số chia","Trừ 1","Không thể kiểm tra"],answer:1,why:"Thương nhân số chia bằng số bị chia nếu phép chia hết."},
        {q:"Tính 7,2 ÷ 3.",options:["2,4","24","4,2","0,24"],answer:0,why:"7,2 ÷ 3 = 2,4."}
      ];
    } else if (/phép cộng|cộng số|tổng/i.test(topic)) {
      questions = [
        {q:"Tính 248 + 175.",options:["413","423","433","323"],answer:1,why:"248 + 175 = 423."},
        {q:"Khi cộng số thập phân, cần đặt thế nào?",options:["Dấu phẩy thẳng cột","Các chữ số tùy ý","Bỏ dấu phẩy","Viết ngược số"],answer:0,why:"Đặt các dấu phẩy thẳng cột để cộng các hàng tương ứng."},
        {q:"Tính 3,6 + 1,4.",options:["4","5","4,10","5,1"],answer:1,why:"3,6 + 1,4 = 5,0 = 5."}
      ];
    } else {
      questions = [
        {q:"Tính 3,6 + 1,4.",options:["4","5","4,10","5,1"],answer:1,why:"3,6 + 1,4 = 5,0 = 5."},
        {q:"Khi thực hiện phép tính, điều gì cần chú ý?",options:["Đọc đúng dấu và dữ kiện","Bỏ qua dấu phép tính","Đoán kết quả","Không cần kiểm tra"],answer:0,why:"Đọc đúng dấu phép tính giúp chọn cách tính chính xác."},
        {q:"Sau khi tính, cách nào giúp kiểm tra kết quả?",options:["Đoán lại","Dùng phép tính ngược hoặc ước lượng","Bỏ qua","Chỉ hỏi bạn"],answer:1,why:"Phép tính ngược hoặc ước lượng giúp kiểm tra tính hợp lý."}
      ];
    }
  } else if (subject === "math" && /đường tròn|hình tròn|chu vi hình tròn|diện tích hình tròn/i.test(topic)) {
    kind = "circle";
    const area = /diện tích/.test(topic);
    explanation = area ? "Diện tích hình tròn bằng bán kính nhân bán kính rồi nhân 3,14." : "Chu vi hình tròn bằng đường kính nhân 3,14.";
    steps = [{title:"Quan sát",text:"Xác định tâm, bán kính và đường kính."},{title:"Thao tác",text:"Kéo thanh trượt bán kính để quan sát hình tròn thay đổi."},{title:"Vận dụng",text:area ? "Tính S = r × r × 3,14." : "Tính C = d × 3,14."}];
    questions = [{q:"Đường kính bằng bao nhiêu lần bán kính?",options:["1 lần","2 lần","3 lần","4 lần"],answer:1,why:"Đường kính bằng hai lần bán kính."},{q:"Bán kính 2 cm, diện tích gần bằng bao nhiêu?",options:["6,28 cm²","12,56 cm²","4 cm²","8 cm²"],answer:1,why:"S = 2 × 2 × 3,14 = 12,56 cm²."},{q:"Tâm hình tròn cách các điểm trên đường tròn như thế nào?",options:["Khoảng cách bằng nhau","Khoảng cách khác nhau","Luôn ở ngoài","Nằm trên đường tròn"],answer:0,why:"Mọi điểm trên đường tròn cách tâm cùng một khoảng bằng bán kính."}];
  } else if (subject === "math" && /hình bình hành/i.test(topic)) {
    kind = "parallelogram";
    explanation = /diện tích/.test(topic) ? "Diện tích hình bình hành bằng đáy nhân với chiều cao tương ứng." : "Hình bình hành có hai cặp cạnh đối diện song song và bằng nhau.";
    steps = [{title:"Quan sát",text:"Nhận biết hai cặp cạnh đối diện song song."},{title:"Thao tác",text:"Kéo thanh trượt để thay đổi đáy và chiều cao."},{title:"Kết luận",text:/diện tích/.test(topic) ? "S = a × h." : "Các cạnh đối diện song song và bằng nhau."}];
    questions = [{q:"Hình bình hành có bao nhiêu cặp cạnh đối diện song song?",options:["1 cặp","2 cặp","3 cặp","Không có"],answer:1,why:"Có hai cặp cạnh đối diện song song."},{q:"Đáy 8 cm, chiều cao 4 cm. Diện tích là?",options:["12 cm²","24 cm²","32 cm²","64 cm²"],answer:2,why:"S = 8 × 4 = 32 cm²."},{q:"Chiều cao tương ứng vuông góc với cạnh nào?",options:["Đáy","Đường chéo","Cạnh bất kỳ","Không cần vuông góc"],answer:0,why:"Chiều cao vuông góc với đáy tương ứng."}];
  } else if (subject === "math" && /hình chữ nhật|hình vuông/i.test(topic)) {
    const square = /hình vuông/.test(topic) && !/chữ nhật/.test(topic);
    kind = square ? "square" : "rectangle";
    explanation = /diện tích/.test(topic) ? (square ? "Diện tích hình vuông bằng cạnh nhân cạnh." : "Diện tích hình chữ nhật bằng chiều dài nhân chiều rộng.") : (square ? "Hình vuông có bốn cạnh bằng nhau và bốn góc vuông." : "Hình chữ nhật có bốn góc vuông, các cạnh đối diện bằng nhau.");
    steps = [{title:"Quan sát",text:"Nhận biết các cạnh và góc vuông."},{title:"Thao tác",text:"Kéo thanh trượt để thay đổi kích thước hình."},{title:"Vận dụng",text:/diện tích/.test(topic) ? (square ? "S = cạnh × cạnh." : "S = dài × rộng.") : "So sánh các cạnh và kiểm tra bốn góc vuông."}];
    questions = [{q:square ? "Hình vuông có mấy cạnh bằng nhau?" : "Các cạnh đối diện của hình chữ nhật như thế nào?",options:["Không bằng nhau","Bằng nhau","Chỉ một cạnh","Không xác định"],answer:1,why:square ? "Bốn cạnh hình vuông bằng nhau." : "Mỗi cặp cạnh đối diện của hình chữ nhật bằng nhau."},{q:"Hình có bốn góc vuông là hình nào?",options:["Hình tam giác","Hình tròn","Hình chữ nhật","Hình thang bất kỳ"],answer:2,why:"Hình chữ nhật có bốn góc vuông."},{q:"Nếu hình vuông có cạnh 5 cm, diện tích là?",options:["10 cm²","20 cm²","25 cm²","30 cm²"],answer:2,why:"S = 5 × 5 = 25 cm²."}];
  } else if (subject === "math" && /đường tròn|hình tròn|hình chữ nhật|hình vuông|chu vi|diện tích/i.test(topic)) {
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
  const prompt = `Bạn là chuyên gia thiết kế mô phỏng dạy học tiểu học Việt Nam. Tạo kịch bản mô phỏng ngắn, đúng lứa tuổi, về chủ đề: ${topic}. Môn: ${subject}; lớp: ${grade}. Trả về CHỈ JSON hợp lệ theo schema {"title":string,"subject":string,"grade":string,"kind":"trapezoid"|"sentence"|"water"|"decimal"|"fraction"|"geometry"|"plant"|"magnet"|"solar"|"cube"|"cuboid"|"triangle"|"rectangle"|"square"|"parallelogram"|"circle"|"percent"|"volume"|"units"|"ratio"|"arithmetic"|"explore","explanation":string,"steps":[{"title":string,"text":string}],"questions":[{"q":string,"options":[string,string,string,string],"answer":number,"why":string}]}. Có 3 bước và 3 câu hỏi, đáp án answer là chỉ số 0-3. Không bịa nội dung sách cụ thể.`;
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
  else if (/đường tròn|hình tròn|chu vi hình tròn|diện tích hình tròn/.test(topicKey)) plan.kind = "circle";
  else if (/hình bình hành/.test(topicKey)) plan.kind = "parallelogram";
  else if (/hình chữ nhật/.test(topicKey)) plan.kind = "rectangle";
  else if (/hình vuông/.test(topicKey)) plan.kind = "square";
  else if (/hình hộp chữ nhật|khối hộp chữ nhật/.test(topicKey)) plan.kind = "cuboid";
  else if (/tam giác/.test(topicKey)) plan.kind = "triangle";
  else if (/hình chữ nhật/.test(topicKey)) plan.kind = "rectangle";
  else if (/hình vuông/.test(topicKey)) plan.kind = "square";
  else if (/hình bình hành/.test(topicKey)) plan.kind = "parallelogram";
  else if (/đường tròn|hình tròn|chu vi hình tròn|diện tích hình tròn/.test(topicKey)) plan.kind = "circle";
  else if (/tỉ số phần trăm|tỉ số|phần trăm|giá trị phần trăm/.test(topicKey)) plan.kind = "percent";
  else if (/thể tích|xăng-ti-mét khối|đề-xi-mét khối|mét khối/.test(topicKey)) plan.kind = "volume";
  else if (/đơn vị đo diện tích|ki-lô-mét vuông|héc-ta|đo lường|đổi đơn vị/.test(topicKey)) plan.kind = "units";
  else if (/tỉ lệ bản đồ|bản đồ|tìm hai số khi biết tổng|tìm hai số khi biết hiệu/.test(topicKey)) plan.kind = "ratio";
  else if (/(?:cộng|trừ|nhân|chia|phép tính).{0,35}số thập phân|số thập phân.{0,35}(?:cộng|trừ|nhân|chia|phép tính)/.test(topicKey)) plan.kind = "arithmetic";
  else if (/số tự nhiên|phép tính với số tự nhiên|cộng số thập phân|trừ số thập phân|nhân số thập phân|chia số thập phân|phép tính|làm tròn số thập phân|so sánh các số thập phân|phép cộng|phép trừ|phép nhân|phép chia|cộng trừ|nhân chia|tính nhẩm|tính giá trị biểu thức|thứ tự thực hiện phép tính|ước lượng kết quả|tính toán/.test(topicKey) && !/phân số|tử số|mẫu số|quy đồng|phần trăm|tỉ số/.test(topicKey)) plan.kind = /thập phân/.test(topicKey) ? "decimal" : "arithmetic";
  else if (/số thập phân|hàng thập phân|phần mười|làm tròn số thập phân|so sánh các số thập phân/.test(topicKey)) plan.kind = "decimal";
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
      let plan;
      try {
        plan = await generate(input);
      } catch (aiError) {
        plan = fallbackPlan(input);
        plan.source = "demo";
        plan.notice = "Chưa tạo được bằng AI; website đã tự chuyển sang mô phỏng mẫu để cô vẫn tiếp tục sử dụng.";
      }
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
