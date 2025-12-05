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

// Valor da cota
const VALOR_COTA = 4.99;

// ==============================
// 🔥 Endpoint oficial PayFort
// ==============================
const PAYFORT_URL = "https://api.payfortbr.club/functions/v1/transactions";

// ==============================
// 🔐 AUTENTICAÇÃO BASIC AUTH
// ==============================
function gerarBasicAuth() {
  const token = Buffer.from(`${PAYFORT_SECRET_KEY}:${PAYFORT_COMPANY_ID}`).toString("base64");
  return `Basic ${token}`;
}

// ==============================
// 🚀 Rota principal — Criar PIX
// ==============================
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

    // ==============================
    // 📦 Payload da transação PIX
    // ==============================

    const payload = {
      type: "pix",
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
      "Authorization": gerarBasicAuth()
    };

    // ==============================
    // 🚀 Requisição PayFort
    // ==============================
    const response = await axios.post(PAYFORT_URL, payload, { headers });

    const dados = response.data;

    // DEBUG — mostra retorno bruto caso precise
    console.log("RETORNO PAYFORT:", JSON.stringify(dados, null, 2));

    if (!dados.pix) {
      return res.status(500).json({
        erro: "A PayFort não retornou dados PIX.",
        respostaBruta: dados
      });
    }

    return res.json({
      pixQrCodeUrl: dados.pix.qrcode_url,
      pixCodigo: dados.pix.copia_cola,
      pixBase64: dados.pix.qrcode_base64,
      transactionId: dados.id,
      valorTotal
    });

  } catch (err) {
    console.log("ERRO PAYFORT:", err.response?.data || err.message);

    return res.status(500).json({
      erro: "Falha ao gerar PIX",
      detalhe: err.response?.data || err.message
    });
  }
});

// ==============================
// 🌐 Servidor ativo
// ==============================
app.listen(PORT, () => {
  console.log("Servidor rodando na porta " + PORT);
});
