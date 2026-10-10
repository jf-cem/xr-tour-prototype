# P01 · comparação PlayCanvas / Spark

10 de outubro de 2026. Resultado: **não aprovado por fluidez no equipamento do ensaio**. Esta página é uma experiência de comparação, não uma substituição da tour nem uma versão móvel aprovada.

## Implementação

PlayCanvas 2.23.0 com o SOG D5 original, quatro milhões de splats e SH3. Fonte reutilizada em `../assets/original.sog`. Não houve decimação, redução de SH, recorte espacial ou geração de novos LoDs. A experiência começa em P01 e permite movimento manual até 3 m em torno desse ponto, incluindo deslocação lateral e olhar livre. Isso limita a exploração, mas **o dataset completo ainda é carregado**: este ensaio compara a representação e o renderizador antes de preparar regiões.

O motor mantém a representação comprimida de SOG em texturas/códigos (`GSplatSogResource`, `decompress:false`), em vez de expandir os coeficientes por splat como no caminho original de Spark. Liberta as fontes de imagem após upload. Estimativas de texturas do motor: cerca de 229 MB em WebGL2 ou 210 MB em WebGPU. Não são leituras da memória total do processo; faltam buffers de trabalho/ordenação, temporários, workers, armazenamento GPU e recursos do browser.

O modo padrão tenta WebGPU com o pipeline automático (ordenação GPU/raster), com fallback explicitamente identificado para WebGL2. `?backend=webgl` força WebGL2; `?backend=webgpu&pipeline=compute` permite reproduzir o teste compute. Ensaio bloqueado em dispositivos móveis para não repetir o carregamento integral que crashou no iPhone.

## Comparação reproduzível

Chromium headless, viewport e buffer 1100×800, resolução 1×, mesma cena, FOV 65°, altura 3 m, origem P01. GPU reportada pelo browser: Intel UHD Graphics via ANGLE/D3D11. Depois da inicialização e cinco segundos de aquecimento, dez segundos de movimento e rotação programados, com contextos isolados e sequenciais:

| Motor | Inicialização local | FPS médios no movimento | p95 de intervalo de frame |
| --- | ---: | ---: | ---: |
| Spark original, WebGL2 | 5,36 s | 13,48 | 75,8 ms |
| PlayCanvas original, WebGL2 | 1,13 s | 9,06 | 275 ms |

Inicialização é a chegada ao objeto carregado, não a medida da primeira imagem visualmente completa. Fonte servida localmente; estes tempos não representam carregamento inicial através da Internet. Os resultados são do browser automatizado, não uma promessa de FPS no browser interativo do utilizador.

Ensaios adicionais na mesma vista P01, com sete segundos de aquecimento, mostraram aproximadamente 9,5 FPS no pipeline WebGPU automático e 4,8 FPS no compute. Estes são valores do ensaio estático, não resultados da mesma sequência programada da tabela. Nenhum atingiu 30 FPS neste equipamento.

Passaram carregamento, verificação de quatro milhões/SH3/representação SOG, movimento frontal e lateral, retorno exato a P01 e ausência de erros de página. Imagem inspecionada: detalhe preservado; contraste/realces têm diferenças face ao Spark e ainda precisam de comparação com D5. Não houve aprovação visual do utilizador.

## Decisão

Trocar o motor e preservar o SOG comprimido diminuiu o tempo de inicialização, mas não resolveu a fluidez. Não expandir este visualizador para P02–P03 nem ligá-lo ao GPS como se estivesse aprovado. Manter a tour atual e o protótipo Spark intactos.

O utilizador pode comparar no próprio browser e exportar o diagnóstico. Se também falhar ali, a experiência com o dataset integral deve ser encerrada. Uma investigação posterior de regiões/streaming, preservando o detalhe observado, é trabalho distinto e não está validada por este teste. Panoramas D5 ou uma cena convencional preparada para tempo real continuam a ser alternativas, com diferenças de navegação a discutir.

## Referências

- [PlayCanvas: aplicação com SOG](https://developer.playcanvas.com/user-manual/gaussian-splatting/building/your-first-app/engine/).
- [PlayCanvas: renderizadores e pipelines](https://developer.playcanvas.com/user-manual/gaussian-splatting/rendering-architecture/renderers/).
- Licença MIT em `../vendor/LICENSE-PlayCanvas.txt`.

Testes e capturas locais: `outputs/xr-tour-prototype/tests/engine-comparison.cjs`, `engine-comparison.json`, `playcanvas.cjs`, `playcanvas-result.json`, `playcanvas-P01.png`.
