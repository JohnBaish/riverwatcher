# Where each mock-up gauge sits along its river, from OS Open Rivers (Ordnance Survey, Open
# Government Licence; not kept in the repo: download the GB shapefile from api.os.uk).
#   python3 -I river-positions.py <Open Rivers data folder> mock-data.json
# Each gauge is put on its nearest stretch of river (preferring one with the EA's river name,
# within 600 m); its distance to the sea is then the distance left to the river's mouth, along
# the network, following the way each stretch flows. A bigger distance is further upstream.
# The route lists the rivers' names on the way down, so a tributary shows where it joins.
import struct,sys,json,math,collections
D=sys.argv[1]
def dbf(path):
    f=open(path,'rb'); h=f.read(32); n,hl,rl=struct.unpack('<IHH',h[4:12]); fields=[]
    while True:
        b=f.read(32)
        if b[0]==0x0d: break
        fields.append((b[:11].split(b'\0')[0].decode(),b[11:12].decode(),b[16]))
    f.seek(hl)
    for _ in range(n):
        r=f.read(rl); o=1; row={}
        for name,t,l in fields: row[name]=r[o:o+l].decode('latin-1').strip(); o+=l
        yield row
def shp_lines(path):
    f=open(path,'rb'); f.seek(100)
    while True:
        h=f.read(8)
        if len(h)<8: return
        n,cl=struct.unpack('>ii',h); c=f.read(cl*2); st=struct.unpack('<i',c[:4])[0]
        if st==0: yield []; continue
        np_,npts=struct.unpack('<ii',c[36:44]); pts=struct.unpack(f'<{2*npts}d',c[44+4*np_:44+4*np_+16*npts])
        yield list(zip(pts[0::2],pts[1::2]))
rows=list(dbf(D+'/WatercourseLink.dbf')); geoms=list(shp_lines(D+'/WatercourseLink.shp'))
import heapq
out=collections.defaultdict(list); inn=collections.defaultdict(list)
for i,r in enumerate(rows):
    L=float(r['length'] or 0); out[r['startNode']].append((r['endNode'],L,i)); inn[r['endNode']].append((r['startNode'],L,i))
nodes=set(out)|set(inn)
outlets=[n for n in nodes if not out.get(n)]
dist={n:0.0 for n in outlets}; nxt={}; pq=[(0.0,n) for n in outlets]; heapq.heapify(pq)
while pq:
    d,n=heapq.heappop(pq)
    if d>dist.get(n,1e18): continue
    for up,L,i in inn.get(n,[]):
        nd=d+L
        if nd<dist.get(up,1e18): dist[up]=nd; nxt[up]=(n,i); heapq.heappush(pq,(nd,up))
# grid index of segments
cell=2000; grid=collections.defaultdict(list)
for i,g in enumerate(geoms):
    for (x1,y1),(x2,y2) in zip(g,g[1:]):
        for cx in range(int(min(x1,x2)//cell),int(max(x1,x2)//cell)+1):
            for cy in range(int(min(y1,y2)//cell),int(max(y1,y2)//cell)+1): grid[(cx,cy)].append(i)
def seg_d(px,py,x1,y1,x2,y2):
    dx,dy=x2-x1,y2-y1; t=0 if dx==dy==0 else max(0,min(1,((px-x1)*dx+(py-y1)*dy)/(dx*dx+dy*dy)))
    return math.hypot(px-(x1+t*dx),py-(y1+t*dy)),t
def norm(s): return s.lower().replace('river ','').strip()
def snap(e,n,river):
    best=None
    for cx in range(int(e//cell)-1,int(e//cell)+2):
        for cy in range(int(n//cell)-1,int(n//cell)+2):
            for i in set(grid.get((cx,cy),[])):
                g=geoms[i]; acc=0; segs=[]
                for (x1,y1),(x2,y2) in zip(g,g[1:]): segs.append((x1,y1,x2,y2,acc)); acc+=math.hypot(x2-x1,y2-y1)
                for x1,y1,x2,y2,a in segs:
                    d,t=seg_d(e,n,x1,y1,x2,y2)
                    named = river and norm(rows[i]['name1'])==norm(river)
                    score=d-(150 if named else 0)
                    if best is None or score<best[0]: best=(score,d,i,a+t*math.hypot(x2-x1,y2-y1),acc)
    return best
def where(e,n,river):
    b=snap(e,n,river)
    if not b or b[1]>600: return None
    _,d,i,along,total=b; r=rows[i]; scale=float(r['length'] or total)/total if total else 1
    tosea=dist.get(r['endNode'],None)
    if tosea is None: return None
    pos=tosea+(total-along)*scale
    # route downstream: names in order
    path=[r['name1']]; node=r['endNode']; joins=None
    while node in nxt:
        here=node; node,j=nxt[node]; nm=rows[j]['name1']
        if nm and nm!=path[-1]:
            if joins is None and path[-1] and norm(path[-1])==norm(r['name1'] or ''): joins=(nm,round(dist[here]/1000,2))
            path.append(nm)
    outlet=node
    return dict(link=r['name1'],snap_m=round(d),tosea_km=round(pos/1000,2),outlet=outlet,route=[p for p in path if p][:6],joins=joins)

M = json.load(open(sys.argv[2]))
done = 0
for ref, g in M['gauges'].items():
    if g.get('easting') is None: continue
    w = where(g['easting'], g['northing'], g.get('river'))
    g['along'] = w and {'link': w['link'], 'toSeaKm': w['tosea_km'], 'outlet': w['outlet'], 'route': w['route'], 'joins': w['joins']}
    done += bool(w)
json.dump(M, open(sys.argv[2], 'w'))
print('placed', done, 'of', len(M['gauges']))
