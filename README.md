# Admin CMS Portal Frontend (v2)

Dự án Frontend quản trị hệ thống (Admin CMS Portal) được phát triển bằng **React 19**, **TypeScript** và build tool **Vite**, sử dụng mô hình thiết kế chia theo tính năng (Feature-based Architecture) giúp dễ dàng mở rộng và bảo trì.

---

## 🛠️ Công nghệ sử dụng (Tech Stack)

### Core
*   **React 19** (Sử dụng các hook mới và tối ưu hóa hiệu năng)
*   **TypeScript** (Đảm bảo type-safe chặt chẽ cho toàn dự án)
*   **Vite 8** (Build tool cực nhanh, hỗ trợ Hot Module Replacement - HMR)

### Styling & UI
*   **Tailwind CSS v4** (Sử dụng trình biên dịch mới `@tailwindcss/vite` tối ưu tốc độ)
*   **Radix UI** (Thư viện UI Unstyled accessible)
*   **Lucide React** (Bộ icons vector đa dạng)
*   **Sonner** (Thư viện hiển thị toast thông báo mượt mà)

### Quản lý Trạng thái & Dữ liệu
*   **TanStack React Query v5** (Đồng bộ, cache và quản lý state từ API)
*   **Zustand v5** (Quản lý global state cực nhẹ và hiệu quả)
*   **Axios** (HTTP Client cấu hình sẵn interceptors tự động refresh token)

### Forms & Drag-Drop
*   **React Hook Form & Zod** (Quản lý form và validate dữ liệu chặt chẽ)
*   **@dnd-kit (Core, Sortable)** (Xử lý kéo thả phân cấp mượt mà cho Menu và Danh mục)
*   **CKEditor 5** (Trình soạn thảo văn bản giàu tính năng cho bài viết)

---

## 📂 Cấu trúc thư mục (Folder Structure)

Thư mục `src` được tổ chức như sau:

```text
src/
├── app/                  # Cấu hình global của ứng dụng
│   ├── layouts/          # Layout giao diện (AdminLayout, AuthLayout)
│   ├── providers/        # React Providers (QueryClientProvider, AuthProvider)
│   ├── routes/           # Định tuyến ứng dụng (React Router v8)
│   └── stores/           # Global store (Zustand)
├── features/             # Các module tính năng độc lập
│   ├── dashboard/        # Bảng điều khiển thống kê tổng quan
│   ├── auth/             # Đăng nhập, đăng xuất, đổi mật khẩu
│   ├── users/            # Quản lý thành viên, nhật ký hoạt động, thiết bị đăng nhập
│   ├── roles/            # Quản lý vai trò (RBAC)
│   ├── categories/       # Quản lý danh mục kéo thả phân cấp (dnd-kit)
│   ├── menus/            # Quản lý menu kéo thả phân cấp đa cấp (dnd-kit)
│   ├── audit-logs/       # Nhật ký thao tác hệ thống (Audit log)
│   └── ai-settings/      # Cấu hình AI model, budget limits & logs
├── services/             # Cấu hình kết nối hệ thống
│   └── http/             # Cấu hình Axios Client (Auto refresh token, interceptors)
├── shared/               # Thành phần dùng chung toàn bộ dự án
│   ├── components/       # Các UI Component dùng chung (Button, Table, Form, Dialog...)
│   ├── hooks/            # Custom hooks dùng chung
│   └── utils/            # Các hàm tiện ích (Format date, cn helper...)
└── main.tsx              # Điểm khởi chạy ứng dụng
```

---

## 🚀 Hướng dẫn cài đặt và chạy ứng dụng

### 1. Yêu cầu hệ thống
*   **Node.js**: Phiên bản 18 trở lên (khuyến nghị v20+)
*   **pnpm**: Trình quản lý package (khuyến nghị sử dụng pnpm để đồng bộ lockfile)

### 2. Cài đặt các thư viện phụ thuộc
Di chuyển vào thư mục dự án và chạy lệnh:
```bash
pnpm install
```

### 3. Cấu hình biến môi trường
Tạo file `.env` tại thư mục gốc của dự án (sử dụng mẫu từ `.env.example`):
```env
VITE_API_URL=http://localhost:8000/api/v1
```

### 4. Chạy môi trường phát triển (Development)
Khởi chạy local server với HMR:
```bash
pnpm dev
```
Ứng dụng sẽ chạy tại địa chỉ mặc định: [http://localhost:5173](http://localhost:5173).

### 5. Build và kiểm tra lỗi code

*   **Kiểm tra lỗi linter:**
    ```bash
    pnpm lint
    ```
*   **Đóng gói sản phẩm (Production Build):**
    ```bash
    pnpm build
    ```
    Mã nguồn sau khi đóng gói sẽ nằm trong thư mục `dist`.
