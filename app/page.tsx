async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    console.log("1. Mula hantar data ke Google...");

    try {
      const response = await fetch(
        "https://script.google.com/macros/s/AKfycbzeGCohq7mGAcQ7igJryYX7Nba3SkZPLDluj44K-Cps1CwWuOEpNdxAGkL4RwBc1nfjLQ/exec",
        {
          method: "POST",
          body: JSON.stringify({ action: "LOGIN", id: idMurid, password: kataLaluan }),
        }
      );

      console.log("2. Google dah respon! Status Code:", response.status);

      const textResult = await response.text();
      console.log("3. Teks jawapan dari Google:", textResult);

      const result = JSON.parse(textResult);

      if (result.success) {
        localStorage.setItem("currentUser", JSON.stringify(result.user));
        if (result.user.role === "guru") {
          window.location.href = "/guru";
        } else {
          window.location.href = "/murid";
        }
      } else {
        setError(result.error || "ID atau kata laluan salah");
      }
    } catch (err: any) {
      console.error("4. ERROR BESAR TANGKAP:", err);
      setError("Ralat: " + (err?.message || "Sila cuba lagi"));
    } finally {
      setLoading(false);
    }
  }