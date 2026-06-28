# Quy tắc phát triển Frontend (React / TSX)

## Quy tắc thiết kế Component & Tổ chức Code
- Một file `.tsx` không nên chứa quá nhiều dòng code HTML/JSX và các logic xử lý (handle logic) phức tạp trộn lẫn với nhau, nhằm tránh tình trạng khó bảo trì (spaghetti code).
- Nếu một component có kích thước lớn hơn 400-500 dòng code hoặc chứa quá nhiều giao diện JSX con, hãy tách nhỏ các phần giao diện đó thành các Sub-components hoặc Custom Hooks riêng biệt để dễ theo dõi và tái sử dụng.
