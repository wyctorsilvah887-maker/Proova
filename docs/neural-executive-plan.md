# Proova - Estratégia de Soberania de IA e Estética Neural

Este documento detalha o plano de transição para uma infraestrutura de IA privada e a evolução da identidade visual para o padrão "Neural Executive".

## 🧠 1. Soberania de Dados (Meta Llama 3 + Ollama)
**Objetivo:** Eliminar a dependência de APIs de terceiros (Google AI/OpenAI) e garantir privacidade absoluta dos dados das clínicas.
- **Infraestrutura:** Hospedagem em servidor privado Bare Metal ou VPS de alta performance utilizando **Ollama**.
- **Modelo:** Meta Llama 3 8B (ou versões superiores conforme disponibilidade).
- **Vantagem Comercial:** Argumento de venda focado em soberania de dados e sigilo médico. Os depoimentos e respostas nunca saem do ambiente controlado da Proova, garantindo conformidade com normas de proteção de dados sensíveis.

## 🎨 2. Identidade Visual "Neural Executive"
**Objetivo:** Reposicionar o Proova como uma central de inteligência avançada e exclusiva.
- **Tema:** Transição para um Dark Mode técnico focado em preto absoluto (#000000) e cinzas profundos.
- **Acentos:** O Laranja Proova evolui para um efeito de "Glow" (Neon), simulando feixes de dados e conexões neurais.
- **UX:** Interface de "Centro de Comando" com micro-animações (scanners, pulsações e barras de progresso dinâmicas) que indicam análise de dados em tempo real.

## ⚙️ 3. Prontidão Técnica para Endpoints
**Objetivo:** Preparar a arquitetura de software para uma troca de endpoint sem interrupções.
- **Server Actions:** Criação de funções de processamento de linguagem natural desacopladas, prontas para apontar para a URL do servidor Ollama.
- **Configuração:** Preparação de variáveis de ambiente (`OLLAMA_ENDPOINT`, `OLLAMA_API_KEY`) para ativação instantânea após o aluguel do servidor.
