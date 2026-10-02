import re,sys
p='src/game.js'; s=open(p,encoding='utf-8',newline='').read(); L=s.split('\n')
i=next(k for k,l in enumerate(L) if l.startswith('function update(dt, now) {'))
j=i+1
while not L[j].startswith('}'): j+=1
out=L[:i+1]
for k in range(i+1,j):
    l=L[k]
    if re.match(r'^  [A-Za-z_(\[{]',l) and not l.startswith('  }'):
        out.append("  __T('L%d');"%(k+1))
    out.append(l)
out.append("  __T('');")
out+=L[j:]
s='\n'.join(out)
helper="const __PR = (window.__PR = {}); let __t0 = 0, __lab = '';\nfunction __T(l){ const n = performance.now(); if (__lab) __PR[__lab] = (__PR[__lab]||0) + n - __t0; __lab = l; __t0 = n; }\nconst __W = (name, f) => function(...a){ const n = performance.now(); try { return f.apply(this, a); } finally { __PR[name] = (__PR[name]||0) + performance.now() - n; } };\n"
m=list(re.finditer(r'^import .*$',s,re.M))[-1]
s=s[:m.end()]+'\n'+helper+s[m.end():]
for fn in sys.argv[1:]:
    if ('function %s('%fn) in s: s=s.replace('function %s('%fn,'const %s = __W(%r, %s0);\nfunction %s0('%(fn,fn,fn,fn),1)
    else: print('miss',fn)
open(p,'w',encoding='utf-8',newline='').write(s)
