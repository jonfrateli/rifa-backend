import express from "express";
import axios from "axios";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// =========================
//   ROTAS
// =========================
app.post("/api/pedido", async (req, res) => {
  try {
    const { nome, whatsapp, email, quantidadeCotas } = req.body;

    if (!nome || !whatsapp || !email || !quantidadeCotas) {
      return res.status(400).json({ erro: "Dados incompletos." });
    }

    if (quantidadeCotas < 4) {
      return res.status(400).json({ erro: "Quantidade mínima é 4 cotas." });
    }

    const valor = Number((quantidadeCotas * 4.99).toFixed(2));

    // ============================
    //    AUTENTICAÇÃO BASIC
    // ============================
    const SECRET = process.env.PAYFORT_SECRET_KEY;
    const COMPANY = process.env.PAYFORT_COMPANY_ID;

    const basicAuth = Buffer.from(`${SECRET}:${COMPANY}`).toString("base64");

    // ============================
    //    REQUISIÇÃO CORRETA
    // ============================
    const response = await axios.post(
      "https://api.payfortbr.club/functions/v1/transactions",
      {
        amount: valor,
        paymentMethod: "pix",
        installments: 1,
        customer: {
          name: nome,
          email: email,
          phone: whatsapp,
          document: { number: "33376407614", type: "CPF" }, // coloque CPF do cliente se quiser
          address: {
            street: "Rua X",
            streetNumber: "1",
            zipCode: "11050100",
            neighborhood: "Centro",
            city: "Santos",
            state: "SP",
            country: "BR"
          }
        }
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${basicAuth}`
        }
      }
    );

    const dados = response.data;

    if (!dados.pix) {
      console.log("ERRO PAYFORT:", dados);
      return res.status(500).json({ erro: "Erro ao gerar PIX.", detalhe: dados });
    }

    return res.json({
      pixQrCodeUrl: dados.pix.qrcode_url,
      pixCodigo: dados.pix.copia_cola,
      transactionId: dados.id,
      valorTotal: valor
    });

  } catch (err) {
    console.log("ERRO PAYFORT:", err.response?.data || err.message);
    return res.status(500).json({ erro: "Erro ao gerar PIX." });
  }
});

// ============================
app.listen(PORT, () => {
  console.log("Servidor rodando na porta " + PORT);
});
