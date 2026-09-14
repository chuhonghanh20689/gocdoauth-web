# Import sản phẩm Google Sheets → Supabase

## 1. Cài package

Chạy trong thư mục project:

```powershell
npm install googleapis @google-cloud/local-auth sharp dotenv
npm install -D tsx
```

Sau đó thêm script vào `package.json`:

```json
"import:products": "tsx scripts/import-products.ts"
```

## 2. Supabase

Chạy `SUPABASE-IMPORT-MIGRATION.sql` trong Supabase SQL Editor.

`.env.local` cần có:

```env
NEXT_PUBLIC_SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
```

Không commit service role key.

## 3. Google OAuth

Tạo OAuth Client loại **Desktop app** trong Google Cloud, bật:
- Google Sheets API
- Google Drive API

Tải file credentials về và đặt tên:

```text
scripts/google-credentials.json
```

Lần đầu chạy importer, trình duyệt sẽ mở để đăng nhập Google và cấp quyền đọc Sheets/Drive.

## 4. Chống commit nhầm credential

Thêm vào `.gitignore`:

```text
scripts/google-credentials.json
scripts/google-token.json
```

## 5. Chạy import

```powershell
npm run import:products
```

Script đã cố định 2 Sheet:
- Nước hoa: `1cHL7fBMdqiItfClY0xu6JsnIVcDiwfAh5-32hwpyxTI`
- Đồng hồ: `1q8w0dzsva7oGbIiEWF4QPyazOIFyDm_YWLr9DHPWCKs`

Script đọc sheet `list`.

## Mapping

- `SKU` → `products.sku`
- `Description` → `products.description` và dòng đầu tiên → `products.name`
- `Brand` → bảng `brands`
- `Code` → `products.details`
- `Cost` → `products.cost` (chỉ admin)
- `Price` → `products.price`
- `Dung tích` → `products.volume` (nước hoa)
- `Photos` → Google Drive folder → ảnh WebP → Supabase Storage `product-images`
- `No` → `sort_order`
- status mặc định → `published`
- currency → `VND`

Import lại cùng SKU sẽ **update** sản phẩm thay vì tạo bản ghi mới.

Nếu một folder Photos được dùng cho nhiều sản phẩm, ảnh Drive được lưu theo Drive file ID nên có thể dùng chung storage object.
