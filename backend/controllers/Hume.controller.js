import { fetchAccessToken } from "hume";

export const getEviAccessToken = async (req, res) => {
  try {
    const apiKey = process.env.HUME_API_KEY?.trim();
    const secretKey = process.env.HUME_SECRET_KEY?.trim();

    if (!apiKey || !secretKey) {
      return res.status(503).json({
        message:
          "Hume EVI is not configured. Add HUME_API_KEY and HUME_SECRET_KEY to backend/.env.",
      });
    }

    const accessToken = await fetchAccessToken({ apiKey, secretKey });

    return res.status(200).json({
      accessToken,
      configId: process.env.HUME_EVI_CONFIG_ID?.trim() || null,
    });
  } catch (error) {
    console.error("[Hume EVI] Failed to create access token:", error);
    return res.status(502).json({
      message: error.message || "Failed to connect to Hume EVI.",
    });
  }
};
