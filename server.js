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

    if (!nome || !whatsapp || !email || !quantidadeCotas) {
      return res.status(400).json({ erro: "Dados incompletos." });
    }

    if (quantidadeCotas < 4) {
      return res.status(400).json({ erro: "Quantidade mínima é 4 cotas." });
    }

    const valorTotal = Number((quantidadeCotas * VALOR_COTA).toFixed(2));

    // NOVA ROTA CORRETA
    const url = "https://app.payfortbr.club/payment/checkout";

    const payload = {
      company_id: PAYFORT_COMPANY_ID,
      payment_method: "pix",
      amount: valorTotal,
      description: `Compra de ${quantidadeCotas} cotas`,
      customer: {
        name: nome,
        email: email,
        phone: whatsapp
      }
    };

    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${PAYFORT_SECRET_KEY}`
    };

    const response = await axios.post(url, payload, { headers });
    const dados = response.data;

    if (!dados.pix) {
      return res.status(500).json({
        erro: "A PayFort não retornou informações PIX.",
        respostaBruta: dados
      });
    }

    return res.json({
      pixQrCodeUrl: dados.pix.qrcode_url,
      pixCodigo: dados.pix.copia_cola,
      pixQrCodeBase64: dados.pix.qrcode_base64,
      transactionId: dados.id,
      valorTotal
    });

  } catch (err) {
    console.log("ERRO PAYFORT:", err.response?.data || err.message);

    return res.status(500).json({
      erro: "Erro ao gerar PIX na PayFort",
      detalhe: err.response?.data || err.message
    });
  }
});

app.listen(PORT, () => {
  console.log("Servidor rodando na porta " + PORT);
});
