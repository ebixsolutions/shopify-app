export default function InternalServerErrorPage({ msg }) {
  const errorMessage =
    typeof msg === "object"
      ? JSON.stringify(msg, null, 2)
      : String(msg || "Unknown error");

  const getQueryString = () => {
    try {
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        return url.search || '';
      }
    } catch {}
    return '';
  };

  const navigateTop = (href) => {
    try {
      const target = typeof window !== 'undefined' && window.top ? window.top : window;
      target.location.href = href;
    } catch {
      try {
        window.location.href = href;
      } catch {}
    }
  };

  const handleGoLogin = () => {
    const params = getQueryString();
    navigateTop(`/auth/index${params || ''}`);
  };

  const handleRetry = () => {
    try {
      const target = typeof window !== 'undefined' && window.top ? window.top : window;
      if (target.history && target.history.length > 1) {
        target.history.back();
      } else {
        target.location.reload();
      }
    } catch {
      try {
        window.location.reload();
      } catch {}
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#f6f7f9",
        padding: "24px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "720px",
          backgroundColor: "#fff",
          boxShadow: "0 12px 24px rgba(0,0,0,0.08)",
          borderRadius: "12px",
          padding: "32px",
        }}
      >
        <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
          <img src="/images/alert.png" alt="Error" style={{ width: 48, height: 48 }} />
          <div>
            <h1 style={{ margin: 0, fontSize: "24px", color: "#1f2937" }}>Something went wrong</h1>
            <p style={{ margin: "6px 0 0", color: "#6b7280" }}>
              We hit an unexpected error. You can try again, or go back to login.
            </p>
          </div>
        </div>

        {process.env.NODE_ENV === "development" && (
          <div
            style={{
              marginTop: "16px",
              background: "#fff7f7",
              border: "1px solid #ffd6d6",
              color: "#b91c1c",
              padding: "12px 14px",
              borderRadius: "8px",
              maxHeight: "240px",
              overflow: "auto",
              whiteSpace: "pre-wrap",
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
              fontSize: "12px",
            }}
          >
            {errorMessage}
          </div>
        )}

        <div style={{ display: "flex", gap: "12px", marginTop: "20px" }}>
          <button
            onClick={handleRetry}
            style={{
              padding: '10px 16px',
              backgroundColor: '#111827',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
            }}
          >
            Retry
          </button>
          <button
            onClick={handleGoLogin}
            style={{
              padding: '10px 16px',
              backgroundColor: '#2563eb',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
            }}
          >
            Go to Login
          </button>
        </div>

        <div style={{ marginTop: "16px", color: "#9ca3af", fontSize: "12px" }}>
          <span>Error code: 500</span>
        </div>
      </div>
    </div>
  );
}
