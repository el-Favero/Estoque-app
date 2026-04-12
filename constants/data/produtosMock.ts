<<<<<<< HEAD
import { Produto } from "../../types/produto";
=======
import { Produto } from "../types/produto";
>>>>>>> 437f47a2a7013bf1d636952d8dfea79fe1203927

export const produtos: Produto[] = [
  {
    id: "1",
    nome: "Arroz",
    categoria: "Secos",
    quantidade: 5,
    minimo: 2,
    validade: "2026-04-20",
  },
  {
    id: "2",
    nome: "Frango congelado",
    categoria: "Proteínas",
    quantidade: 1,
    minimo: 3,
    validade: "2026-02-25",
  },
];