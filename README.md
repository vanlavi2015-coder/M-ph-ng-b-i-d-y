# Mô phỏng bài dạy AI

Ứng dụng web tiếng Việt dành cho giáo viên tiểu học, ưu tiên lớp 5.

## Chạy thử trên máy tính
1. Cài Node.js 18 trở lên.
2. Giải nén thư mục.
3. Mở terminal tại thư mục dự án và chạy `npm start`.
4. Mở `http://localhost:3000`.

## Triển khai lên Render
1. Tạo một repository GitHub RIÊNG cho dự án này (không dùng repository LAVI đang hoạt động).
2. Tải các tệp trong thư mục dự án lên repository.
3. Trong Render chọn New > Web Service và kết nối repository.
4. Build command: `npm install` (có thể để trống vì không có dependency ngoài).
5. Start command: `npm start`.
6. Nếu muốn bật tạo kịch bản bằng AI thật, thêm biến môi trường `OPENAI_API_KEY` trong Render. Có thể đặt `OPENAI_MODEL` nếu cần. Không đặt khóa API trong tệp HTML.
7. Sau khi Render triển khai xong, dùng URL `.onrender.com` được Render cấp.

## Chức năng hiện có
- Nhập yêu cầu, chọn môn và lớp để tạo kịch bản.
- Mô hình hình thang có thanh trượt đáy và chiều cao, tự tính diện tích.
- Mô hình minh họa Tiếng Việt/Khoa học.
- Câu hỏi trắc nghiệm, phản hồi và tính điểm.
- Chế độ trình chiếu, in/lưu PDF và sao chép kịch bản.
- Nếu không có `OPENAI_API_KEY`, hệ thống dùng chế độ mô phỏng mẫu; khi cấu hình khóa hợp lệ, server gọi API AI để tạo kịch bản theo yêu cầu.

Lưu ý: Giáo viên cần kiểm tra nội dung do AI tạo trước khi dạy. Đây là bản đầu tiên, chưa có tài khoản người dùng hay lưu thư viện bài dạy lên cơ sở dữ liệu.
