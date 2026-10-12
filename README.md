# CEM · XR tour prototype

## Ensaio atual — D5 1080p, 12 de outubro de 2026

A entrada principal abre agora https://jf-cem.github.io/xr-tour-prototype/1080p/.
Carrega em **Abrir XR 1080p**, arrasta para olhar e usa P01–P03, o percurso ou Avançar/Recuar.
No telemóvel, «Olhar com telemóvel» pede a permissão de sensores quando necessária.
Se a imagem tiver pouca fluidez, escolhe **Imagem → Leve**.

Fonte: `2109609102809157633.sog.zip`, copiada sem alteração para `1080p/assets/d5-1080p.sog`.
SHA-256: `d0dc146705a85ba06d6012ae5f4eae763bb74181d1fe02e638c8eab5d5b2e137`.
15 836 471 bytes, 973 259 splats, SOG v2, SH3. O PLY de 229,7 MB fica nos originais e não é publicado.
PlayCanvas 2.23.0 com WebGL2 e representação SOG comprimida (`decompress:false`, `unified:false`).
Sem gerar LOD nem expandir o PLY no browser. Depois do upload libertam-se as fontes das texturas.
A cena só começa a carregar ao premir Abrir; não se descarregam os assets anteriores de 2K.
Resolução móvel em píxeis CSS, no máximo 1× e um milhão de píxeis; o DPR do telefone não multiplica a renderização.

Validação local em Chromium: carregamento e imagem P01/P03, percurso de 16,38 m, botões de caminhada,
arrasto do olhar, resolução Leve, perfil móvel 390×844 com DPR3 sem overflow nem erros.
O motor reportou cerca de 31,3 MB em texturas no ensaio local; não é a memória total do processo.
O perfil móvel de Chromium não valida Safari, Firefox ou sensores num telefone real.
A qualidade visual é inferior à fonte 2K, com desfocagem evidente na vegetação/periferia.
Em Desempenho e opções, **Guardar diagnóstico** exporta estado, FPS, resolução e perdas de contexto.

Os ensaios anteriores permanecem em [index-2k.html](index-2k.html), [playcanvas/](playcanvas/),
[selective/](selective/) e [garden/](garden/). As notas seguintes descrevem a versão anterior.

Piloto separado: https://jf-cem.github.io/xr-tour-prototype/

Original D5 2K: https://jf-cem.github.io/xr-tour-prototype/index-2k.html?quality=original

Escolhe P01, P02 e P03 ou usa o cursor e os botões Avançar/Recuar. Arrasta para olhar, ou ativa Olhar com telemóvel. Este protótipo usa movimento manual; o GPS permanece na tour principal.

## Qualidade

- Muito leve: orçamento de 250 mil splats.
- Leve: 500 mil splats.
- Detalhada: um milhão de splats.
- Original D5: quatro milhões de splats, SH3 e sem LoD, a partir do SOG original (55,9 MB).

Os modos progressivos usam SH1 e 84 blocos SPZ (101,8 MB no total), descarregados conforme a vista. O modo original é mais exigente e pode não ser adequado a todos os telemóveis. Em Desempenho e opções podes aumentar a resolução até 2×. Trocar entre original e progressivo recarrega a página e preserva posição e orientação para libertar os recursos anteriores.

## Proteção móvel · v0.3

Após relatos de crash em Safari e Firefox Focus no iPhone ao abrir o original, o perfil móvel passa a 100 mil splats, resolução 1×, cache de páginas de 1 048 576 splats e um download de bloco em simultâneo. O original e os perfis acima de 250 mil ficam indisponíveis em dispositivos móveis, incluindo iPad em modo desktop. Links antigos `?quality=original` são normalizados antes de pedir ficheiros ou criar o renderizador. O original permanece disponível em desktop.

Testes de regressão em Chromium com configuração móvel e tablet confirmaram que o SOG original não é pedido, que os limites são aplicados e que o modelo progressivo aparece sem erros. Isto não substitui a validação física no iPhone nem confirma a causa exata da falha reportada. O perfil móvel reduz a nitidez para diminuir a carga.

Spark 2.3.1, Three.js r180, licenças MIT em vendor/. Conversão progressiva com o conversor oficial Spark, commit c57ebb936a5d364e021a66a118204d599f6fdaa8: `build-lod --quick --max-sh=1 --csplat --spz-chunked stream.sog`.

Testado localmente em Chromium: carregamento dos quatro milhões de splats, SH3, LoD desativado no original, troca de modos, preservação da posição e seleção de resolução 2×. Os testes de desktop não comprovam desempenho no iPhone. Alinhamento das câmaras verificado visualmente, sem calibração topográfica.
