# P01 · detalhe por zona · 10 de outubro de 2026

Ensaio para avaliação; **não aprovado como solução de qualidade e fluidez**. O fundo tem perda visível de detalhe. Não substitui a tour nem foi validado num iPhone. Não implementa resolução seletiva 2×: mantém o framebuffer a 1× e distribui o detalhe dos splats.

## Dados

Fonte D5 SOG original: 4 000 000 splats. Partição em 847 626 protegidos e 3 152 374 de fundo, sem duplicação ou omissão de índices. As zonas protegidas abrangem os três cartazes localizados por raycast, piso e lancis próximos e banco. Uma esfera com raio de três vezes a maior escala de cada Gaussian protege splats que atravessam as fronteiras. É uma margem conservadora de suporte, não um limite matemático da cauda gaussiana.

O SOG protegido (13 191 991 bytes) mantém exatamente os códigos/pixels originais de posições, escalas, rotações, opacidade e cor, incluindo os codebooks e centroids SH3. O script compara cada imagem reempacotada com os pixels selecionados antes de a gravar. SH3 é conservado no fundo, mas os níveis agregados alteram a geometria e cor por aproximação. Os chunks são gerados com Spark build-lod `--quick --max-sh=3 --csplat --spz-chunked`; só o fundo recebe LoD. Spark 2.3.1 faz uma ordenação conjunta dos dois conjuntos.

Os assets novos totalizam cerca de 111 MB no repositório; o fundo é paginado e não se deve interpretar esse total como download inicial. Não foi obtida uma medida completa e fiável de download inicial: Resource Timing omite parte dos pedidos de workers e não serve para essa conclusão.

## Correção da validação

A comparação de FPS publicada em zone01 foi invalidada: o teste multiplicava um quaternion Three.js por um objeto simples, produzindo componentes NaN durante o movimento programado. As capturas iniciais, anteriores ao movimento, permanecem válidas. As contagens de splats, partição e verificação de identidade dos pixels permanecem válidas.

Os números 12,98 / 23,44 / 15,41 FPS foram retirados. A repetição corrigida usa um quaternion real e verifica explicitamente componentes finitas. A repetição corrigida do perfil 500 mil, no mesmo equipamento e viewport 1100×800, com dez segundos de aquecimento e dez de movimento, mediu 8,78 FPS e p95 de 175,1 ms. Foi uma execução posterior à comparação do jardim e não uma comparação simultânea. O teste passou com rotação finita e sem erros. Não atingiu 30 FPS.

A inspeção inicial mantém a conclusão visual: cartazes e pavimento nítidos; copas e edifícios desfocados. Não houve aprovação do fundo como qualidade final. O ensaio novo do jardim preserva também a vegetação, sem LoD nos splats retidos.

## Recorte espacial auditado

Raio horizontal em torno de P01, conservando também os splats cujo suporte de três escalas interseta o círculo:

| Raio | Mantidos | Removidos |
| --- | ---: | ---: |
| 200 m | 3 873 492 | 3,16% |
| 100 m | 3 793 745 | 5,16% |
| 50 m | 3 476 622 | 13,08% |
| 30 m | 3 267 380 | 18,32% |
| 20 m | 3 028 498 | 24,29% |

Recortes só por raio não removem a maior parte desta fonte. Estes números são uma auditoria; o visualizador publicado ainda conserva o cenário completo, com fundo adaptativo. Para eliminar edifícios próximos desnecessários, é preciso selecionar volumes/objetos e avaliar o fundo que fica visível após a remoção. A fonte original permanece intacta.
