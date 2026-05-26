async function handleLogin(e: React.FormEvent) {
  e.preventDefault();

  setLoading(true);
  setError("");

  try {

    const response = await fetch(
      "https://script.google.com/macros/s/AKfycbzeGCohq7mGAcQ7igJryYX7Nba3SkZPLDluj44K-Cps1CwWuOEpNdxAGkL4RwBc1nfjLQ/exec",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          action: "LOGIN",
          id: idMurid,
          password: kataLaluan
        })
      }
    );

    const result = await response.json();

    if (result.success) {

      localStorage.setItem(
        "currentUser",
        JSON.stringify(result.user)
      );

      if (result.user.role === "guru") {
        window.location.href="/guru";
      } else {
        window.location.href="/murid";
      }

    } else {
      setError(result.error || "ID atau kata laluan salah");
    }

  } catch(err:any) {

    console.error(err);

    setError(
      "Ralat: " + (err.message || "Sila cuba lagi")
    );

  } finally {

    setLoading(false);

  }
}