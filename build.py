from pathlib import Path
import shutil
r=Path(__file__).parent
h=(r/'source/index.html').read_text();css=(r/'source/styles.css').read_text();js=(r/'source/app.js').read_text()+'\n'+(r/'source/simulator.js').read_text()
h=h.replace('<link rel="stylesheet" href="styles.css">',f'<style>\n{css}\n</style>').replace('  <script src="app.js" defer></script>','')
data=''
for tag,file in [('script-data','script.json'),('layout-data','layout.json')]:
 data+=f'<script id="{tag}" type="application/json">'+(r/'source'/file).read_text().replace('<','\\u003c')+'</script>\n'
h=h.replace('</body>',data+'<script>\n'+js+'\n</script>\n</body>')
(r/'dist').mkdir(exist_ok=True);(r/'dist/index.html').write_text(h)
shutil.copytree(r/'source/assets',r/'dist/assets',dirs_exist_ok=True)
