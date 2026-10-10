# P01 · detalhe por zona · 10 de outubro de 2026

Ensaio para avaliação; **não aprovado como solução de qualidade e fluidez**. O fundo tem perda visível de detalhe. Não substitui a tour nem foi validado num iPhone. Não implementa resolução seletiva 2×: mantém o framebuffer a 1× e distribui o detalhe dos splats.

## Dados

Fonte D5 SOG original: 4 000 000 splats. Partição em 847 626 protegidos e 3 152 374 de fundo, sem duplicação ou omissão de índices. As zonas protegidas abrangem os três cartazes localizados por raycast, piso e lancis próximos e banco. Uma esfera com raio de três vezes a maior escala de cada Gaussian protege splats que atravessam as fronteiras. É uma margem conservadora de suporte, não um limite matemático da cauda gaussiana.

O SOG protegido (13 191 991 bytes) mantém exatamente os códigos/pixels originais de posições, escalas, rotações, opacidade e cor, incluindo os codebooks e centroids SH3. O script compara cada imagem reempacotada com os pixels selecionados antes de a gravar. SH3 é conservado no fundo, mas os níveis agregados alteram a geometria e cor por aproximação. Os chunks são gerados com Spark build-lod `--quick --max-sh=3 --csplat --spz-chunked`; só o fundo recebe LoD. Spark 2.3.1 faz uma ordenação conjunta dos dois conjuntos.

Os assets novos totalizam cerca de 111 MB no repositório; o fundo é paginado e não se deve interpretar esse total como download inicial. Não foi obtida uma medida completa e fiável de download inicial: Resource Timing omite parte dos pedidos de workers e não serve para essa conclusão.

## Comparação

Chromium headless na Intel UHD Graphics, 1100×800, framebuffer 1×, FOV 65°, mesma posição e vista P01, contextos sequenciais isolados. Dez segundos de aquecimento, seguidos por dez segundos de rotação ±20° e deslocação programadas.

| Perfil | FPS médios em movimento | p95 de intervalo de frame | Splats ativos ao terminar |
| --- | ---: | ---: | ---: |
| Original completo | 12,98 | 100,0 ms | 4 000 000 |
| Protegidos + fundo 500 mil | 23,44 | 58,2 ms | 1 345 881 |
| Protegidos + fundo 800 mil | 15,41 | 75,1 ms | 1 568 173 |

O orçamento do fundo é um alvo de LoD, não uma contagem garantida. Os ensaios 500 mil/original foram feitos na mesma execução; 800 mil foi uma execução posterior no mesmo equipamento. Os FPS podem variar no browser interativo. Nenhum atingiu 30 FPS.

Cartazes e pavimento mantêm nitidez na inspeção de P01. Copas e edifícios ficam visivelmente desfocados; subir o fundo para 800 mil piorou a fluidez e não resolveu suficientemente a qualidade. Não há aprovação visual do utilizador. A inspeção não cobre todas as vistas 360° ou todos os pontos dentro do raio de 3 m.

Passaram contagens, carregamento sem erros, movimento frontal/lateral, limite de 3 m, regresso exato a P01, manutenção da câmara na troca de comparação e bloqueio de downloads pesados em UA iPhone. Teste local: `tests/selective.cjs`; auditoria: `tests/partition-p01.py`.

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
