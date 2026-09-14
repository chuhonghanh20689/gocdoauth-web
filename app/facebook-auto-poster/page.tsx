export const metadata = {
  title: "Góc Đồ Auth",
  description:
    "Thông tin về các công cụ được Góc Đồ Auth sử dụng để quản lý nội dung và vận hành thương hiệu.",
};

export default function FacebookAutoPosterPage() {
  return (
    <main className="page">
      <div className="container">
        <div className="kicker">Góc Đồ Auth / Thông tin ứng dụng</div>

        <h1>Góc Đồ Auth</h1>

        <p style={{ whiteSpace: "pre-line", lineHeight: 1.8 }}>
          Góc Đồ Auth sử dụng một số công cụ nội bộ để hỗ trợ việc quản lý
          nội dung và vận hành các kênh chính thức của thương hiệu.
        </p>

        <section>
          <h2>Về ứng dụng</h2>
          <p style={{ whiteSpace: "pre-line", lineHeight: 1.8 }}>
            Ứng dụng này là công cụ nội bộ dành cho những người được Góc Đồ Auth
            ủy quyền. Ứng dụng hỗ trợ quản lý nội dung sản phẩm và chuẩn bị,
            quản lý hoặc xuất bản nội dung tới các kênh truyền thông chính thức
            của Góc Đồ Auth thông qua các dịch vụ được tích hợp.
          </p>
        </section>

        <section>
          <h2>Quyền truy cập</h2>
          <p style={{ whiteSpace: "pre-line", lineHeight: 1.8 }}>
            Chỉ người dùng được Góc Đồ Auth ủy quyền mới sử dụng ứng dụng.
            Ứng dụng chỉ yêu cầu quyền truy cập cần thiết cho các chức năng
            được người dùng chủ động sử dụng và không dành cho khách truy cập
            catalogue.
          </p>
        </section>

        <section>
          <h2>Thông tin và dữ liệu</h2>
          <p style={{ whiteSpace: "pre-line", lineHeight: 1.8 }}>
            Khi sử dụng các dịch vụ của Google để đăng nhập hoặc thực hiện
            chức năng được tích hợp, ứng dụng có thể xử lý thông tin tài khoản
            và dữ liệu từ các dịch vụ Google mà người dùng đã cấp quyền.
            Dữ liệu này chỉ được sử dụng cho mục đích vận hành các chức năng
            được ủy quyền của ứng dụng và không được bán cho bên thứ ba.
          </p>
        </section>

        <section>
          <h2>Chính sách và điều khoản</h2>
          <p style={{ lineHeight: 1.8 }}>
            <a href="/privacy">Chính sách bảo mật →</a>
          </p>
          <p style={{ lineHeight: 1.8 }}>
            <a href="/terms">Điều khoản sử dụng website →</a>
          </p>
        </section>
      </div>
    </main>
  );
}
