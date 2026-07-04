# Tiêu chuẩn Cấu trúc Feature: Articles

Tài liệu này mô tả cấu trúc thư mục, kiến trúc và nội dung chi tiết của từng tệp tin trong feature `articles`. Đây là tiêu chuẩn mẫu để áp dụng khi thiết kế và xây dựng các feature khác trong dự án.

---

## 1. Sơ đồ Cấu trúc Thư mục (Directory Structure)

Thư mục feature được tổ chức theo mô hình **Feature-based Folder Structure** (cấu trúc theo tính năng), tự đóng gói toàn bộ UI, logic, types, hooks và services liên quan:

```text
src/features/articles/
├── components/                 # Các UI Components của feature
│   ├── form/                   # Các Sub-components của Form bài viết
│   │   ├── AiGenerateModal.tsx
│   │   ├── AiRewriteModal.tsx
│   │   ├── ArticleBasicInfoSection.tsx
│   │   ├── ArticleEditorSection.tsx
│   │   ├── ArticleMediaSection.tsx
│   │   ├── ArticlePublishSection.tsx
│   │   ├── ArticleSeoSection.tsx
│   │   ├── MyDraftsModal.tsx
│   │   └── SeoAnalysisPanel.tsx
│   ├── preview/                # Các Components phục vụ xem trước (Preview)
│   │   ├── ArticlePreviewContent.tsx
│   │   └── ArticleSeoInspector.tsx
│   ├── ArticleFilters.tsx      # Bộ lọc tìm kiếm cho danh sách bài viết
│   ├── ArticleForm.tsx         # Component Form tổng hợp (kết nối các sub-components)
│   ├── ArticleTable.tsx        # Bảng hiển thị danh sách bài viết
│   ├── AutocompleteSelect.tsx  # Component select tìm kiếm động (Async Select)
│   └── articleColumns.tsx      # Định nghĩa các cột cho bảng (React Table Columns)
├── hooks/                      # Custom Hooks quản lý State và Logic nghiệp vụ
│   ├── useArticleForm.ts       # Hook chính xử lý logic Form, đa ngôn ngữ, dịch thuật, lưu nháp
│   ├── useArticlePreview.ts    # Hook quản lý trạng thái xem trước bài viết
│   └── useSeoAnalysis.ts       # Hook gọi AI phân tích SEO và cập nhật kết quả
├── pages/                      # Các trang (Entrypoints) được gọi bởi Router
│   ├── ArticleDetailPage.tsx   # Trang chi tiết bài viết
│   ├── ArticleDraftsPage.tsx   # Trang quản lý bài viết nháp
│   ├── ArticleEditPage.tsx     # Trang chỉnh sửa bài viết
│   ├── ArticleFormPage.tsx     # Trang tạo mới bài viết
│   └── ArticlesPage.tsx        # Trang danh sách bài viết (Dashboard)
├── services/                   # Các API Services tương tác với Backend
│   └── articleService.ts       # Đóng gói toàn bộ API liên quan đến bài viết
├── types/                      # Định nghĩa kiểu dữ liệu (TypeScript Interfaces/Types)
│   └── articles.types.ts       # Type-safe định nghĩa cho Article, Payload, Params...
├── utils/                      # Các hàm tiện ích (Helpers) cục bộ cho feature
│   └── media.ts                # Xử lý media/files riêng cho bài viết
└── constants.ts                # Các hằng số (Constants) dùng chung trong feature
```

---

## 2. Chi tiết cấu trúc và Nội dung bên trong từng File

Dưới đây là chi tiết cụ thể về các hàm, components, interfaces và logic nghiệp vụ được khai báo bên trong từng tệp tin của feature `articles`:

### 2.1. Cấu hình & Kiểu dữ liệu (Configuration & Types)

#### 📄 [constants.ts](file:///Users/huynh/codes/KTCN/v2/src/features/articles/constants.ts)
*   **Mục đích:** Lưu trữ các giá trị cấu hình cố định được sử dụng xuyên suốt feature.
*   **Nội dung bên trong:**
    *   `SEO_CONFIG`: Khai báo hằng số `SUFFIX` (ví dụ: ` - Khoa Công nghệ & Công nghệ - Đại học Vinh` để tự động nối vào cuối tiêu đề SEO khi hiển thị) và cấu hình `LIMITS` (độ dài tối đa của Title là 60 ký tự, Description là 160 ký tự) phục vụ đếm số từ và thanh progress đo lường chuẩn SEO.

#### 📄 [types/articles.types.ts](file:///Users/huynh/codes/KTCN/v2/src/features/articles/types/articles.types.ts)
*   **Mục đích:** Khai báo toàn bộ các TypeScript interface để đảm bảo tính chặt chẽ về kiểu dữ liệu (Type-Safety) trong toàn feature.
*   **Nội dung bên trong:**
    *   `CategoryInfo`, `TagTranslation`, `TagInfo`, `AuthorInfo`: Kiểu dữ liệu cho các thực thể quan hệ đi kèm bài viết.
    *   `ArticleTranslation`: Interface đại diện cho dữ liệu có thể dịch thuật của bài viết (`title`, `slug`, `excerpt`, `content`, `seo_title`, `seo_description`, `canonical_url`, `robots`, `og_title`, `og_description`, `og_image`).
    *   `Article`: Interface hoàn chỉnh của một bài viết, phản ánh cấu trúc dữ liệu trả về từ DB (bao gồm quan hệ translations, category, tags, author, status, count views, timestamps).
    *   `ArticleListParams`: Cấu trúc tham số gửi lên API để phân trang, tìm kiếm, lọc bài viết.
    *   `ArticleCreatePayload`: Cấu trúc payload gửi lên khi tạo mới hoặc cập nhật bài viết (hỗ trợ lưu nháp `is_draft` và cấu trúc translations đa ngôn ngữ).
    *   Các kiểu dữ liệu bổ trợ cho tích hợp AI: `SeoIssue`, `SeoAnalysisResponse`, `ArticleSEORewriteRequest`/`Response`, `ArticleGenerateByIdeaRequest`/`Response`, `ArticleSummaryRequest`/`Response`.

---

### 2.2. Dịch vụ API (API Services)

#### 📄 [services/articleService.ts](file:///Users/huynh/codes/KTCN/v2/src/features/articles/services/articleService.ts)
*   **Mục đích:** Đóng gói toàn bộ các HTTP request tương tác với Backend. Sử dụng axios client dùng chung (`httpClient`).
*   **Nội dung bên trong (Các API Methods):**
    *   **Quản lý dữ liệu:**
        *   `list(params)`: Lấy danh sách bài viết (tự động loại bỏ các param rỗng/null trước khi gửi).
        *   `getDetail(id)`: Lấy thông tin chi tiết một bài viết.
        *   `create(payload)` / `update(id, payload)`: Tạo mới hoặc chỉnh sửa bài viết.
        *   `delete(id)` / `restore(id)`: Xóa tạm bài viết vào thùng rác hoặc khôi phục lại.
        *   `archive(id)` / `publish(id)`: Chuyển đổi trạng thái bài viết nhanh (lưu trữ hoặc xuất bản).
        *   `bulkStatus(payload)`: Thay đổi trạng thái hàng loạt các bài viết đã chọn.
        *   `updateAttributes(id, payload)`: Cập nhật nhanh các thuộc tính phụ (ví dụ: cờ ghim `is_pinned`).
    *   **Tìm kiếm & Autocomplete:**
        *   `searchCategories(search)`, `searchAuthors(search)`, `searchTags(search)`: Tìm kiếm nhanh danh mục, tác giả, thẻ tag phục vụ các trường nhập Autocomplete.
        *   `listCategories()`, `listTags()`: Lấy toàn bộ danh sách danh mục hoạt động và thẻ tag để điền vào dropdowns.
        *   `checkSlug(slug)`: Kiểm tra tính duy nhất của slug trên hệ thống và tự động gợi ý slug khả dụng nếu bị trùng.
        *   `listMyDrafts(params)`, `countMyDrafts()`: Xem và đếm số lượng bài viết nháp cá nhân.
    *   **Hỗ trợ truyền thông:**
        *   `uploadMedia(file)`: Gửi file lên server để nhận về `object_key` lưu vào DB (sử dụng Header `multipart/form-data`).
    *   **Tích hợp AI Engine:**
        *   `analyzeSeo(articleId, payload)`: Gửi bài viết đi phân tích điểm SEO (timeout: 30s).
        *   `seoRewrite(articleId, payload)`: Yêu cầu AI viết lại nội dung tối ưu theo từ khóa chính (timeout: 60s).
        *   `generateByIdea(payload)`: Yêu cầu AI sinh bài viết hoàn chỉnh từ dàn ý thô (timeout: 60s).
        *   `seoSummarize(articleId, payload)`: Yêu cầu AI tóm tắt nội dung bài viết để làm tóm tắt ngắn (timeout: 30s).

---

### 2.3. Tách biệt Logic & State (Custom Hooks)

#### 📄 [hooks/useArticleForm.ts](file:///Users/huynh/codes/KTCN/v2/src/features/articles/hooks/useArticleForm.ts)
*   **Mục đích:** Custom hook cốt lõi quản lý toàn bộ trạng thái dữ liệu và các hành động (actions) của Form Bài viết. Giúp loại bỏ hoàn toàn mã logic phức tạp khỏi JSX.
*   **Nội dung bên trong:**
    *   **State Management:**
        *   Quản lý các trường dữ liệu tiếng Việt độc lập (`viTitle`, `viSlug`, `viExcerpt`, `viContent`, `viSeoTitle`, `viSeoDescription`, v.v.) và tiếng Anh tương ứng.
        *   Quản lý trạng thái override thủ công (`isViSeoTitleOverridden`, v.v.) nhằm ngăn chặn tự động ghi đè khi biên tập viên đã nhập thủ công.
        *   Quản lý các trường chung (`categoryId`, `tagIds`, `status`, `publishAt`, `expireAt`, `thumbnailKey`, `coverKey`, `isPinned`).
        *   Quản lý lỗi validation (`errors`) cho từng trường/ngôn ngữ.
    *   **Queries & Mutations (React Query):**
        *   Tự động tải chi tiết bài viết khi ở chế độ chỉnh sửa (`articleDetail`), đồng bộ dữ liệu vào form, và kiểm tra quyền tác giả (nếu không phải tác giả thì chặn chỉnh sửa).
        *   `saveMutation`: Thực thi API save bài viết, tự động điều hướng và thông báo thành công.
    *   **Event-driven Logic:**
        *   Tự động phát sinh SEO Title và SEO Description từ dữ liệu tiêu đề và nội dung nhập vào thời gian thực (real-time).
        *   Debounce kiểm tra slug khả dụng từ database khi người dùng nhập tiêu đề (chờ 500ms dừng gõ để tránh spam request).
    *   **AI Translation Actions:**
        *   `handleTranslateTitle()`, `handleTranslateExcerpt()`, `handleTranslateContent()`: Gọi API dịch thuật tương ứng từ Tiếng Việt sang Tiếng Anh, tự xử lý tải/lỗi và cập nhật vào các state Tiếng Anh tương ứng.

#### 📄 [hooks/useSeoAnalysis.ts](file:///Users/huynh/codes/KTCN/v2/src/features/articles/hooks/useSeoAnalysis.ts)
*   **Mục đích:** Quản lý logic gọi phân tích SEO, xử lý kết quả trả về từ AI để vẽ giao diện điểm SEO và danh sách đề xuất.
*   **Nội dung bên trong:**
    *   `handleAnalyze()`: Hàm kích hoạt kiểm tra. Thực hiện validate tiêu đề trước khi phân tích, xử lý toast loading/success/error.
    *   `handleApplyTitle(generatedTitle)` & `handleApplyDescription(generatedDesc)`: Áp dụng các gợi ý tiêu đề/mô tả do AI viết trực tiếp vào các state của Form và đánh dấu cờ override.
    *   `getStatusConfig(status, score)`: Hàm helper trả về các Tailwind class màu sắc (Xanh cho Tốt, Vàng cho Cần cải thiện, Đỏ cho Kém) dựa trên điểm số SEO để hiển thị biểu đồ tròn.

#### 📄 [hooks/useArticlePreview.ts](file:///Users/huynh/codes/KTCN/v2/src/features/articles/hooks/useArticlePreview.ts)
*   **Mục đích:** Quản lý trạng thái ẩn/hiện của chế độ xem trước (Preview) và chuyển đổi tab ngôn ngữ xem trước.

---

### 2.4. Các Trang Entrypoints (`pages/`)

Các trang bọc ngoài chịu trách nhiệm cung cấp Layout và kết nối với bộ định tuyến (Router).

*   📄 [ArticlesPage.tsx](file:///Users/huynh/codes/KTCN/v2/src/features/articles/pages/ArticlesPage.tsx): Trang Dashboard danh sách. Kết nối các số liệu thống kê (`articleService.getStats`), bộ lọc `<ArticleFilters>` và bảng dữ liệu `<ArticleTable>`.
*   📄 [ArticleFormPage.tsx](file:///Users/huynh/codes/KTCN/v2/src/features/articles/pages/ArticleFormPage.tsx): Trang Tạo bài viết mới. Render component `<ArticleForm articleId={null} />`.
*   📄 [ArticleEditPage.tsx](file:///Users/huynh/codes/KTCN/v2/src/features/articles/pages/ArticleEditPage.tsx): Trang Chỉnh sửa. Lấy ID bài viết từ URL params của router (`useParams`) và truyền vào `<ArticleForm articleId={id} />`.
*   📄 [ArticleDraftsPage.tsx](file:///Users/huynh/codes/KTCN/v2/src/features/articles/pages/ArticleDraftsPage.tsx): Trang chuyên biệt danh sách bài nháp cá nhân.
*   📄 [ArticleDetailPage.tsx](file:///Users/huynh/codes/KTCN/v2/src/features/articles/pages/ArticleDetailPage.tsx): Trang xem chi tiết bài viết phía quản trị (giao diện đọc bài viết hoàn chỉnh).

---

### 2.5. Giao diện Người dùng (Components)

#### 📄 [components/ArticleForm.tsx](file:///Users/huynh/codes/KTCN/v2/src/features/articles/components/ArticleForm.tsx)
*   **Mục đích:** Component cha của biểu mẫu tạo/sửa bài viết. Kết nối logic từ `useArticleForm` sang các sub-components chuyên trách để tạo nên một giao diện thống nhất.
*   **Nội dung bên trong:**
    *   Bọc giao diện trong các tab Ngôn ngữ (Tiếng Việt / Tiếng Anh) và tab Xem trước (Preview).
    *   Bố cục màn hình dạng lưới: phần nhập liệu lớn ở bên trái, các panel cấu hình phụ (Media, Publish, SEO) ở bên phải.
    *   Render các Sub-sections và truyền state cùng callback tương ứng.
    *   Quản lý các nút hành động chân trang: Lưu nháp, Xuất bản, Hủy bỏ.

#### 📄 [components/ArticleFilters.tsx](file:///Users/huynh/codes/KTCN/v2/src/features/articles/components/ArticleFilters.tsx)
*   **Mục đích:** Bộ lọc tìm kiếm trên trang danh sách.
*   **Nội dung bên trong:**
    *   Debounce ô tìm kiếm text (`search`) với thời gian 400ms.
    *   Sử dụng component `<AutocompleteSelect>` để thực hiện tìm kiếm bất đồng bộ và tải danh sách Danh mục, Tác giả, và các thẻ Tag khi người dùng gõ từ khóa.
    *   Có nút "Lọc thêm" để ẩn/hiện các bộ lọc nâng cao (Trạng thái bài viết, Cờ ghim, Ngày tạo bài viết).

#### 📄 [components/ArticleTable.tsx](file:///Users/huynh/codes/KTCN/v2/src/features/articles/components/ArticleTable.tsx)
*   **Mục đích:** Hiển thị danh sách bài viết dưới dạng bảng dữ liệu phân trang.
*   **Nội dung bên trong:**
    *   Tích hợp thư viện bảng (ví dụ: `@tanstack/react-table`).
    *   Xử lý logic chọn nhiều dòng (Row Selection) để thực hiện các thao tác hàng loạt (Bulk actions như xuất bản đồng thời, xóa đồng thời).
    *   Tích hợp phân trang với UI điều khiển trang (Trang trước/sau, kích thước trang).

#### 📄 [components/articleColumns.tsx](file:///Users/huynh/codes/KTCN/v2/src/features/articles/components/articleColumns.tsx)
*   **Mục đích:** Định nghĩa cấu hình các cột hiển thị của bảng bài viết.
*   **Nội dung bên trong:**
    *   Định nghĩa hiển thị cho từng cột: Tiêu đề (hiển thị kèm ảnh thumbnail nhỏ gọn), Danh mục, Tác giả, Lượt xem, Trạng thái (được bọc trong Badge màu sắc sinh động), Ngày xuất bản, Cờ ghim (hiển thị icon ghim nổi bật).
    *   Cột hành động (Actions): menu popup chứa các nút Xem chi tiết, Sửa, Gỡ xuất bản, Lưu trữ, Xóa vào thùng rác/Xóa vĩnh viễn, Khôi phục tương ứng với trạng thái bài viết.

#### 📄 [components/AutocompleteSelect.tsx](file:///Users/huynh/codes/KTCN/v2/src/features/articles/components/AutocompleteSelect.tsx)
*   **Mục đích:** Component chọn dữ liệu tùy chỉnh hỗ trợ tìm kiếm động từ API.
*   **Nội dung bên trong:**
    *   Hỗ trợ tham số `onSearch` để fetch dữ liệu từ server khi người dùng nhập từ khóa.
    *   Hỗ trợ chế độ chọn đơn (`isMulti={false}`) hoặc chọn nhiều (`isMulti={true}`).
    *   Hỗ trợ custom render tùy chọn hiển thị (`renderOption`), ví dụ như hiển thị avatar tác giả hoặc màu sắc riêng của tag.

---

### 2.6. Các Sub-components của Form (`components/form/`)

#### 📄 [components/form/ArticleBasicInfoSection.tsx](file:///Users/huynh/codes/KTCN/v2/src/features/articles/components/form/ArticleBasicInfoSection.tsx)
*   **Mục đích:** Quản lý giao diện nhập thông tin căn bản của bài viết.
*   **Nội dung bên trong:**
    *   Ô nhập Tiêu đề, Slug (kèm nút tạo tự động và biểu tượng loading kiểm tra slug độc bản), chọn Danh mục.
    *   Ô nhập Tóm tắt ngắn (excerpt).
    *   Nút dịch thuật nhanh tiêu đề và tóm tắt ngắn từ Tiếng Việt sang Tiếng Anh bằng AI.

#### 📄 [components/form/ArticleEditorSection.tsx](file:///Users/huynh/codes/KTCN/v2/src/features/articles/components/form/ArticleEditorSection.tsx)
*   **Mục đích:** Khu vực viết nội dung chính của bài viết, sử dụng trình soạn thảo nâng cao.
*   **Nội dung bên trong:**
    *   Bọc trình soạn thảo HTML `<CmsEditor>`.
    *   Hỗ trợ nút **Phóng to/Thu nhỏ** để chuyển đổi sang chế độ viết toàn màn hình (Fullscreen Editor) giúp biên tập viên tập trung tối đa.
    *   Tích hợp nút AI Rewrite mở modal `<AiRewriteModal>` hỗ trợ viết lại nội dung chuẩn SEO.
    *   Nút dịch nhanh toàn bộ nội dung HTML sang Tiếng Anh.

#### 📄 [components/form/ArticleMediaSection.tsx](file:///Users/huynh/codes/KTCN/v2/src/features/articles/components/form/ArticleMediaSection.tsx)
*   **Mục đích:** Quản lý hình ảnh đại diện cho bài viết.
*   **Nội dung bên trong:**
    *   Khu vực tải ảnh đại diện danh sách (Thumbnail) và ảnh bìa bài viết (Cover Image).
    *   Sử dụng cơ chế kéo thả tập tin (Dropzone), gọi API `articleService.uploadMedia` để tải ảnh lên máy chủ ngay lập tức và hiển thị bản xem trước (Preview) kèm nút xóa ảnh.

#### 📄 [components/form/ArticlePublishSection.tsx](file:///Users/huynh/codes/KTCN/v2/src/features/articles/components/form/ArticlePublishSection.tsx)
*   **Mục đích:** Cấu hình thời gian xuất bản và các thuộc tính phân phối bài viết.
*   **Nội dung bên trong:**
    *   Dropdown chọn trạng thái xuất bản: Xuất bản ngay (`PUBLISHED`) hoặc Lên lịch hẹn giờ (`SCHEDULED`).
    *   Trường chọn Ngày giờ xuất bản (chỉ khả dụng khi chọn hẹn giờ) và Ngày giờ hết hạn gỡ bài viết.
    *   Nút chuyển đổi (Switch) cấu hình ghim bài viết lên vị trí nổi bật nhất (`is_pinned`).

#### 📄 [components/form/ArticleSeoSection.tsx](file:///Users/huynh/codes/KTCN/v2/src/features/articles/components/form/ArticleSeoSection.tsx)
*   **Mục đích:** Nhập liệu các thuộc tính SEO thủ công và hiển thị bảng điểm phân tích.
*   **Nội dung bên trong:**
    *   Nhập Từ khóa chính (`focus_keyword`), SEO Title, SEO Description, Canonical URL, Robots tag.
    *   Nhúng component `<SeoAnalysisPanel>` trực tiếp bên cạnh để hiển thị điểm số và các vấn đề SEO theo thời gian thực khi biên tập viên soạn thảo bài viết.

#### 📄 [components/form/SeoAnalysisPanel.tsx](file:///Users/huynh/codes/KTCN/v2/src/features/articles/components/form/SeoAnalysisPanel.tsx)
*   **Mục đích:** Bảng hiển thị kết quả phân tích SEO từ AI.
*   **Nội dung bên trong:**
    *   Hiển thị biểu đồ vòng tròn điểm số SEO (0-100%).
    *   Liệt kê các vấn đề SEO được phân loại theo mức độ nghiêm trọng:
        *   🔴 **Lỗi nghiêm trọng (Errors):** Cần sửa đổi khẩn cấp để có thể lập chỉ mục (Index).
        *   🟡 **Cần cải thiện (Warnings):** Các điểm chưa tối ưu cần nâng cấp.
        *   🟢 **Đã đạt yêu cầu (Passed Checks):** Các tiêu chuẩn SEO đã đáp ứng tốt.
    *   Cung cấp nút kích hoạt phân tích lại và nút áp dụng tiêu đề/mô tả gợi ý từ AI.

#### 📄 [components/form/AiGenerateModal.tsx](file:///Users/huynh/codes/KTCN/v2/src/features/articles/components/form/AiGenerateModal.tsx)
*   **Mục đích:** Modal giao diện để AI sinh bài viết tự động từ ý tưởng.
*   **Nội dung bên trong:**
    *   Form nhập: Ý tưởng bài viết, Từ khóa mong muốn, lựa chọn Văn phong (chuyên nghiệp, sáng tạo, học thuật, thuyết phục) và Ngôn ngữ đích.
    *   Hiển thị màn hình chờ tải (Loading screen) sinh động với hiệu ứng chạy thanh tiến trình giả lập (0-95%) và luân chuyển các câu nói quote của AI để cải thiện UX khi phải chờ API phản hồi lâu (từ 15-30 giây).

#### 📄 [components/form/AiRewriteModal.tsx](file:///Users/huynh/codes/KTCN/v2/src/features/articles/components/form/AiRewriteModal.tsx)
*   **Mục đích:** Giao diện hỗ trợ AI viết lại và tối ưu hóa nội dung bài viết.
*   **Nội dung bên trong:**
    *   Cho phép chọn chế độ viết lại: Tối ưu chuẩn SEO, Rút gọn nội dung, Mở rộng chi tiết, hoặc Thay đổi văn phong.
    *   So sánh song song nội dung cũ và nội dung mới do AI đề xuất để biên tập viên kiểm tra trước khi nhấn áp dụng (Apply).

#### 📄 [components/form/MyDraftsModal.tsx](file:///Users/huynh/codes/KTCN/v2/src/features/articles/components/form/MyDraftsModal.tsx)
*   **Mục đích:** Modal hiển thị danh sách các bản nháp bài viết chưa hoàn thành của tác giả hiện tại giúp khôi phục nhanh trạng thái làm việc.

---

### 2.7. Preview & Helpers (`components/preview/` & `utils/`)

#### 📄 [components/preview/ArticlePreviewContent.tsx](file:///Users/huynh/codes/KTCN/v2/src/features/articles/components/preview/ArticlePreviewContent.tsx)
*   **Mục đích:** Giả lập viewport xem trước bài viết trên trang Client.
*   **Nội dung bên trong:**
    *   Hiển thị cấu trúc bài viết thực tế gồm: Danh mục, Tiêu đề lớn, Tác giả & Ngày đăng, Ảnh bìa lớn (Cover), Tóm tắt in nghiêng và render nội dung HTML gốc của bài viết. Dùng các class CSS typography để đảm bảo hiển thị giống 100% trang người dùng cuối.

#### 📄 [components/preview/ArticleSeoInspector.tsx](file:///Users/huynh/codes/KTCN/v2/src/features/articles/components/preview/ArticleSeoInspector.tsx)
*   **Mục đích:** Giả lập hiển thị SEO của bài viết khi tìm kiếm hoặc chia sẻ.
*   **Nội dung bên trong:**
    *   **Google Search Preview:** Hiển thị Snippet gồm Title, URL, Description giả lập trên kết quả tìm kiếm Google di động & máy tính.
    *   **Social Media Preview:** Giả lập khung card chia sẻ mạng xã hội (Facebook/Zalo OpenGraph card) gồm ảnh bìa bài viết, website domain, tiêu đề in đậm, mô tả tóm tắt bên dưới.
    *   Tích hợp thanh đo lường số lượng ký tự (`CharCounter`) trực quan để kiểm tra Title/Description có bị vượt giới hạn và bị cắt ngắn bằng dấu ba chấm hay không.

#### 📄 [utils/media.ts](file:///Users/huynh/codes/KTCN/v2/src/features/articles/utils/media.ts)
*   **Mục đích:** Chứa hàm helper xử lý đường dẫn đa phương tiện.
*   **Nội dung bên trong:**
    *   `getMediaUrl(objectKey)`: Hàm nhận vào `objectKey` của tập tin trên server và trả về URL đầy đủ từ CDN hoặc MinIO để component Image hiển thị (nếu key trống hoặc có dạng URL thì giữ nguyên).

---
*Tài liệu này được tạo ra để thiết lập tiêu chuẩn phát triển dự án.*
