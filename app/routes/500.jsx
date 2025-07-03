export default function InternalServerErrorPage({ msg }) {
  const errorMessage =
    typeof msg === "object"
      ? JSON.stringify(msg, null, 2)
      : String(msg || "Unknown error");

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{
          width: "100%",
          padding: "50px",
          boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)",
          backgroundColor: "#fff",
          textAlign: "center",
        }}
      >
        <h1 style={{ fontSize: "30px", color: "red" }}>
          500 - Internal Server Error
        </h1>
        <p>Something went wrong on our end. Please try again later.</p>

        {process.env.NODE_ENV === "development" ? (
          <pre
            style={{
              color: "red",
              textAlign: "left",
              margin: "10px auto",
              maxWidth: "500px",
              backgroundColor: "#f8d7da",
              padding: "10px",
              borderRadius: "5px",
              whiteSpace: "pre-wrap",
            }}
          >
            {errorMessage}
          </pre>
        ) : (
          <p>If the issue persists, please contact support.</p>
        )}
        <button
        onClick={() => window.location.href = '/'}
          style={{
          marginTop: '20px',
          padding: '10px 20px',
          backgroundColor: '#007BFF',
          color: '#fff',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
          }}
        >
          Go Back to Home
        </button>
      </div>
    </div>
  );
}
