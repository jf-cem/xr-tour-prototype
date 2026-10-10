# Jardim recortado · garden01 · 10 de outubro de 2026

Ensaio separado de computador. Preserva a vegetação do jardim, cartazes, mobiliário e pavimento com os dados originais de todos os splats retidos, sem LoD, redução de SH ou decimação. **Não aprovado como solução final de fluidez ou como versão móvel.**

## Recorte e integridade

Foi inspecionada uma projeção superior da própria fonte, alinhada com P01 e com as referências geométricas já disponíveis. A faixa baixa corresponde aproximadamente ao jardim central entre as filas de estacionamento: Z de −5,8 a +7,4 m em coordenadas relativas a P01, altura de −1 a +4,5 m. As copas conservam uma faixa mais larga: Z de −9 a +11 m, altura de +4 a +24 m. Cada splat é protegido por uma esfera com raio de três vezes a sua maior escala: um suporte que interseta a faixa é mantido. A esfera é conservadora; a cauda de um Gaussian não tem limite finito.

Não se limitou o comprimento à planta: X de −415 a +355 m cobre toda a amplitude longitudinal dos centros na fonte. Isto conserva também os dados existentes na extensão dos panoramas. É um recorte por volumes alinhados com o eixo disponível; não é uma segmentação semântica de cada canteiro ou carro, nem uma validação topográfica de todo o percurso. Fora da fonte captada não são criados dados.

- Original: 4 000 000 splats / 55 933 841 bytes.
- Recortado: **2 675 760 splats / 37 789 044 bytes**.
- Retirados: **1 324 240 splats (33,11%)**; redução de ficheiro de cerca de 32,4%.
- Conservados para além de P03 (X < −18 m): 50 802 splats. A densidade do jardim decresce muito nessa extensão.

Os seis conjuntos de pixels por splat foram comparados integralmente após reempacotamento WebP sem perdas. Posições, escalas, rotações, opacidades, SH0 e rótulos SH3 são idênticos aos selecionados na fonte; metadata/codebooks e imagem de centroids SH3 são conservados. O original não foi alterado. Auditoria reproduzível: `tests/audit-garden.py`, `tests/build-garden.py`; manifesto em `assets/crop.json`.

As filas exteriores de estacionamento, os carros nelas e grande parte dos edifícios foram excluídos pelo recorte geométrico. Não há garantia de remoção semântica de todos os fragmentos de carros. A vista fica com céu de fundo fora do jardim. Persistem linhas/franjas desfocadas junto a algumas bordas; não se usaram máscaras que apagassem partes da vegetação para ocultá-las.

## Validação corrigida

Foi encontrado um erro nos testes anteriores de movimento: multiplicar um quaternion Three.js por um objeto simples produz NaN. Os números de FPS publicados anteriormente para Spark e detalhe por zonas foram invalidados. As imagens estáticas iniciais, contagens e auditorias de integridade não dependiam dessa rotação e continuam válidas. Os testes agora usam um quaternion Three.js real e verificam explicitamente componentes finitas.

Chromium headless / Intel UHD Graphics, 1100×800, resolução 1×, FOV 65°, mesma vista P01, contextos sequenciais isolados, dez segundos de aquecimento e dez de movimento e rotação válidos:

| Fonte | FPS médios | p95 do intervalo de frame |
| --- | ---: | ---: |
| Original completo | 6,09 | 175,2 ms |
| Jardim recortado, detalhe original | 7,59 | 216,7 ms |

O ganho médio é modesto e o p95 não melhorou; nenhum atingiu 30 FPS. Estes valores são do equipamento e browser de teste, não uma promessa de desempenho no browser interativo do utilizador. Preservar a vegetação aumenta o custo face ao ensaio que a simplificava.

Passaram carregamento sem erros, contagens, posição/rotação finitas, movimento frontal e lateral, limite de 3 m, regresso a P01, manutenção da câmara ao comparar com a fonte completa e bloqueio dos downloads pesados num UA iPhone. Inspeção visual de frente, laterais, retaguarda, P02, P03 e extensão P07. Vegetação e copas preservadas em P01; persistem artefactos de borda e degradação da reconstrução nas vistas distantes. O visualizador permanece em P01 com raio de exploração de 3 m: o recorte estendido não equivale a uma navegação completa aprovada.

Testes: `tests/garden.cjs`, `tests/garden-result.json`; imagens `tests/garden-*.png`. A tour principal e os pilotos anteriores mantêm o seu funcionamento.
