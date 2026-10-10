# CEM · XR tour prototype

Piloto separado: https://jf-cem.github.io/xr-tour-prototype/

Original D5: https://jf-cem.github.io/xr-tour-prototype/?quality=original

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
