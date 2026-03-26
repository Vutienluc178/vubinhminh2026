
# Olympic Math Exam Studio

Ứng dụng hỗ trợ giáo viên Toán soạn đề và phiếu học tập chuyên sâu bằng AI.

## Cài đặt và Chạy thử (Local)

1.  Clone repo về máy.
2.  Chạy lệnh cài đặt thư viện:
    ```bash
    npm install
    ```
3.  Chạy ứng dụng:
    ```bash
    npm run dev
    ```

## Triển khai lên GitHub Pages

Để deploy ứng dụng này lên GitHub Pages, bạn cần thực hiện các bước sau:

1.  Đảm bảo bạn đã có repository trên GitHub.
2.  Mở file `package.json` và kiểm tra phần `"homepage"`. Nếu cần thiết, bạn có thể chỉnh sửa thành đường dẫn đầy đủ: `"https://<username>.github.io/<repo-name>"`, tuy nhiên giá trị `.` hiện tại thường hoạt động tốt.
3.  Chạy lệnh deploy:
    ```bash
    npm run deploy
    ```
4.  Lệnh này sẽ tự động:
    - Build ứng dụng ra thư mục `dist`.
    - Đẩy thư mục `dist` lên nhánh `gh-pages` của repository.

Sau khi chạy xong, hãy vào Settings của Repository trên GitHub -> Pages -> Chọn source là nhánh `gh-pages` nếu chưa được chọn tự động.

## Lưu ý về API Key

Do đây là ứng dụng chạy hoàn toàn trên trình duyệt (Client-side), bạn cần nhập API Key Gemini của riêng mình vào phần Cài đặt (nút bánh răng trên giao diện) để sử dụng. Key này sẽ được lưu an toàn trong trình duyệt của bạn (LocalStorage).
