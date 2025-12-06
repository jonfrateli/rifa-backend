import express from "express";
import axios from "axios";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const PAYFORT_SECRET_KEY = process.env.PAYFORT_SECRET_KEY;
const PAYFORT_COMPANY_ID = process.env.PAYFORT_COMPANY_ID;

const VALOR_COTA = 4.99;

app.post("/api/pedido", async (req, res) => {
  try {
    const { nome, whatsapp, email, quantidadeCotas } = req.body;

    if (!nome || !whatsapp || !email || !quantidadeCotas)
      return res.status(400).json({ erro: "Dados incompletos." });

    if (quantidadeCotas < 4)
      return res.status(400).json({ erro: "Quantidade mínima é 4 cotas." });

    const valorTotal = Number((quantidadeCotas * VALOR_COTA).toFixed(2));

    // 🔥 Endpoint certo da documentação
    const url = "https://api.payfortbr.club/functions/v1/transactions";

    const payload = {
      amount: valorTotal,
      type: "pix",
      description: `Compra de ${quantidadeCotas} cotas`
    };

    // 🔥 Autenticação Basic CERTA
    const cred = Buffer.from(
      `${PAYFORT_SECRET_KEY}:${PAYFORT_COMPANY_ID}`
    ).toString("base64");

    const headers = {
      "Authorization": `Basic ${cred}`,
      "Content-Type": "application/json"
    };

    const response = await axios.post(url, payload, { headers });

    console.log("PAYFORT RESPONSE:", response.data);

    return res.json(response.data);

  } catch (err) {
    console.log("ERRO PAYFORT:", err.response?.data || err.message);

    return res.status(500).json({
      erro: "Erro ao gerar PIX na PayFort.",
      detalhe: err.response?.data || err.message
    });
  }
});

app.listen(PORT, () => {
  console.log("Servidor rodando na porta " + PORT);
});
