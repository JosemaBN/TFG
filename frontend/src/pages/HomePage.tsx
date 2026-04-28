import portadaUrl from "../assets/Portada.png";
export default function HomePage() {
    return (<section style={{ width: "100%", background: "#e5e7eb" }}>
      <img src={portadaUrl} alt="Portada" style={{
            width: "100%",
            maxWidth: "none",
            height: "auto",
            display: "block",
            margin: 0,
            borderRadius: 0,
        }}/>
    </section>);
}
