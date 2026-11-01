from PIL import Image, ImageDraw, ImageFont
from pathlib import Path
import math, subprocess, shutil, json
ROOT=Path(__file__).resolve().parents[1]
IMG=ROOT/'assets'
W,H,FPS,SECONDS=1280,720,24,28
CYAN='#55daf2'; ORANGE='#ffad62'; GREEN='#88e0bb'; WHITE='#edf4fa'
FONT='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
BOLD='/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
def font(n,b=False):return ImageFont.truetype(BOLD if b else FONT,n)
fonts={n:font(n) for n in [12,13,14,15,16,18,20,24,30,40]}
def txt(d,xy,s,n=16,c=WHITE,b=False): d.text(xy,s,font=font(n,b),fill=c)
def panel(d,box,fill=(10,18,29,235),outline=(69,91,112,220),r=12):d.rounded_rectangle(box,radius=r,fill=fill,outline=outline,width=1)
def clamp(v):return max(0,min(1,v))
def lerp(a,b,t):return tuple(a[i]+(b[i]-a[i])*clamp(t) for i in [0,1])
def path(points,t):
 t=clamp(t);lens=[math.dist(a,b) for a,b in zip(points,points[1:])];v=t*sum(lens)
 for i,l in enumerate(lens):
  if v<=l:return lerp(points[i],points[i+1],v/l if l else 0)
  v-=l
 return points[-1]
def pos(x,y):return x*W,y*H
background=Image.open(IMG/'maps/01_map_clean.png').convert('RGBA').resize((W,H),Image.Resampling.LANCZOS)
raw={key:Image.open(IMG/name).convert('RGBA') for key,name in {'guard':'units/10_security_officer.png','guard_b':'units/11_security_officer_b.png','police':'units/12_shield_officer.png','looter':'units/13_looter_box.png','looter_b':'units/14_looter_box_b.png','barrier':'props/15_barrier.png','camera':'props/16_camera_mast.png','van':'props/17_police_van.png','car':'props/18_car_intact.png','wreck':'props/19_car_burned.png'}.items()}
sprites={}
def spr(key,height):
 k=(key,height)
 if k not in sprites:
  im=raw[key];bbox=im.getchannel('A').point(lambda p:255 if p>32 else 0).getbbox();im=im.crop(bbox)
  sprites[k]=im.resize((int(im.width*height/im.height),height),Image.Resampling.LANCZOS)
 return sprites[k]
def actor(im,key,xy,height=63,selected=False,bob=0):
 x,y=xy;s=spr(key,height);d=ImageDraw.Draw(im)
 d.ellipse((x-15,y-4,x+15,y+5),fill=(0,0,0,100))
 if selected:d.ellipse((x-21,y-6,x+21,y+8),outline=CYAN,width=2)
 im.alpha_composite(s,(int(x-s.width/2),int(y-s.height+bob)))
def line(d,pts,color=CYAN):
 for a,b in zip(pts,pts[1:]):
  n=max(1,int(math.dist(a,b)/15))
  for k in range(n):
   d.line([lerp(a,b,k/n),lerp(a,b,min(1,k/n+.5/n))],fill=color,width=2)
def pointer(d,xy,click=False,t=0):
 x,y=xy;d.polygon([(x,y),(x+4,y+23),(x+10,y+16),(x+19,y+16)],fill='white',outline='#091827',width=2)
 if click:
  rr=14+int(7*math.sin(t*12));d.ellipse((x-rr,y-rr,x+rr,y+rr),outline=CYAN,width=2)
# Movements are deliberately scripted to demonstrate interactions, not a gameplay simulation.
def render(t):
 im=background.copy();d=ImageDraw.Draw(im,'RGBA'); attack=t>=21
 # All anchors are ground contact points in the shared map coordinate system.
 actor(im,'van',pos(.88,.48),90)
 actor(im,'wreck' if t>=9 else 'car',pos(.15,.29),64)
 if t>=5:actor(im,'barrier',pos(.27,.43),42)
 if t>=7:
  d.polygon([pos(.72,.43),pos(.59,.35),pos(.59,.49)],fill=(72,218,242,30))
  actor(im,'camera',pos(.72,.43),102)
 # Guard deployment and reserve movement.
 g1=path([pos(.44,.72),pos(.37,.60),pos(.36,.46),pos(.46,.43)],(t-2.8)/2.8)
 reserve=path([pos(.63,.65),pos(.65,.55),pos(.66,.45),pos(.62,.43)],(t-10)/3.4)
 actor(im,'guard',g1,63,selected=2<t<6,bob=-abs(math.sin(t*10))*2 if 2.8<t<5.6 else 0)
 actor(im,'guard_b',reserve,63,selected=10<t<14,bob=-abs(math.sin(t*10))*2 if 10<t<13.4 else 0)
 for off in [0,.025]:actor(im,'police',pos(.775+off,.46+off),65)
 # Loot carriers moving from breached storefronts toward exits, then intercepted.
 if 8<t<18:
  for k in range(6):
   elapsed=t-8-k*.55
   if elapsed<0:continue
   route=[pos(.52,.405),pos(.63,.43),pos(.70,.48),pos(.77,.58)]
   p=path(route,min(elapsed/7,.45 if t<14.2 else .62))
   if t>14.2+k*.23:continue
   actor(im,'looter_b' if k%2 else 'looter',(p[0]+k%2*13,p[1]+k%3*12),62,bob=-abs(math.sin(t*11+k))*2)
 if 6<t<11:
  for k in range(4):
   p=path([pos(.17,.17),pos(.24,.35),pos(.27,.40)],(t-6-k*.45)/4)
   actor(im,'looter_b' if k%2 else 'looter',(p[0]+k%2*14,p[1]-k*5),58)
 # Reinforced shutter upgrade, explicitly shown as a game-state overlay.
 if t>=16:
  box=(int(W*.477),int(H*.307),int(W*.541),int(H*.389))
  d.rounded_rectangle(box,radius=2,fill=(55,71,84,230),outline=CYAN,width=2)
  for yy in range(box[1]+4,box[3]-1,5):d.line((box[0]+2,yy,box[2]-2,yy),fill=(138,154,163,230),width=1)
 if attack:
  line(d,[pos(.52,.41),pos(.63,.43),pos(.72,.5),pos(.82,.64)],ORANGE)
  for k in range(4):
   q=path([pos(.52,.41),pos(.63,.43),pos(.72,.5),pos(.82,.64)],(t-22-k*.45)/4)
   actor(im,'looter_b' if k%2 else 'looter',(q[0]+k%2*12,q[1]+k%2*9),63,selected=k==0,bob=-abs(math.sin(t*10+k))*2)
  d.ellipse((W*.8-35,H*.64-12,W*.8+35,H*.64+12),outline=ORANGE,width=3)
 # Shop status badges.
 for x,title,hp in [(.33,'JEWELLER',100),(.505,'ELECTRONICS',84 if t>=12 else 100),(.675,'FASHION',100)]:
  xx,yy=pos(x,.273)
  panel(d,(xx-65,yy-26,xx+65,yy+11),fill=(10,18,29,235),r=6)
  txt(d,(xx-55,yy-22),title,12)
  d.rounded_rectangle((xx-55,yy-2,xx+55,yy+3),radius=2,fill='#304650')
  d.rounded_rectangle((xx-55,yy-2,xx-55+110*hp/100,yy+3),radius=2,fill=GREEN)
 # Readable cinematic UI, leaves central battlefield open.
 d.rectangle((0,0,W,64),fill=(7,14,25,245));txt(d,(25,12),'CITY HOLD',24,b=True)
 txt(d,(205,20),'PARIS  /  FOUNTAIN DISTRICT',14,c='#9cb4c9')
 txt(d,(625,13),'LOOTERS' if attack else 'DEFENCE',16,c=ORANGE if attack else CYAN,b=True)
 money=1500-(250 if t>=3 else 0)-(150 if t>=5 else 0)-(200 if t>=7 else 0)-(300 if t>=16 else 0)+(350 if t>=19 else 0)
 txt(d,(800,13),f'BUDGET  {money:,}',16,b=True);txt(d,(1030,13),'WAVE 1 / 12',16)
 txt(d,(25,46),'GAMEPLAY MOCK-UP  /  SCRIPTED DESIGN REFERENCE',10 if False else 12,c='#8198ad')
 # Current interaction cue.
 cues=[(0,'CHOOSE YOUR SIDE','Defend the district or recover loot and escape.'),(2,'DEPLOY SECURITY','Select a team, then click a valid ground position.'),(5,'BUILD A BARRIER','Spend budget to slow one approach.'),(7,'ADD CAMERA COVERAGE','Detection supports the mobile response team.'),(9,'RESPOND TO A BREACH','Loot carriers must reach an exit to score.'),(10.5,'MOVE THE RESERVE','Select your reserve and intercept the escape route.'),(14,'RECOVER THE GOODS','Intercepted carriers lose their loot.'),(15.5,'UPGRADE THE STOREFRONT','Reinforced shutter  /  cost 300  /  level 2'),(18.5,'WAVE SECURED','Stores protected. Budget reward: +350.'),(21,'PLAY THE OTHER SIDE','Choose a target and dispatch a group.'),(23,'ESCAPE WITH THE LOOT','Carriers move slower. Only extracted goods count.')]
 cue=next(v for v in reversed(cues) if t>=v[0]);panel(d,(22,78,535,147));txt(d,(39,88),cue[1],18,c=ORANGE if attack else CYAN,b=True);txt(d,(39,118),cue[2],14)
 d.rectangle((0,608,W,H),fill=(7,14,25,247))
 cards=[('guard','SECURITY','250'),('police','SHIELD TEAM','400'),('barrier','BARRIER','150'),('camera','CAMERA','200')]
 if attack:cards=[('looter','CARRIER','100'),('looter_b','CARRIER +','150'),('barrier','ROUTE','SELECT'),('camera','TARGET','SELECT')]
 for i,(key,label,cost) in enumerate(cards):
  x=22+i*207;sel=(i==0 and 2<t<5) or(i==2 and 5<t<7)or(i==3 and 7<t<9)or(attack and i==1)
  panel(d,(x,623,x+195,705),outline=CYAN if sel else '#34485d')
  s=spr(key,65);im.alpha_composite(s,(x+6,630))
  txt(d,(x+73,637),label,13,b=True);txt(d,(x+73,662),cost,16,c=ORANGE if attack else CYAN)
 panel(d,(865,623,1258,705));txt(d,(885,633),'EXTRACTED LOOT' if attack else 'SELECTED STORE',12,c='#9cb4c9')
 txt(d,(885,655),f'{max(0,int((t-25)*2))} / 10 GOODS' if attack else ('SHUTTER  LEVEL 2' if t>=16 else 'SHUTTER  LEVEL 1'),18,b=True)
 txt(d,(885,682),'Tap target > choose route' if attack else ('UPGRADED' if t>=16 else 'UPGRADE  300'),12,c=GREEN if t>=16 else CYAN)
 # Deterministic cursor movement visualizes clicks.
 curs=[(0,(640,390)),(2,(90,661)),(3,(90,661)),(4,pos(.46,.43)),(5,(487,661)),(6,pos(.27,.43)),(7,(710,661)),(8,pos(.72,.43)),(10,pos(.63,.65)),(11,pos(.63,.65)),(12,pos(.66,.45)),(14,pos(.65,.45)),(15,(1080,681)),(16,(1080,681)),(18,(1080,681)),(21,(300,661)),(22,(300,661)),(23,pos(.505,.39)),(24,pos(.80,.64)),(28,pos(.80,.64))]
 for (ta,a),(tb,b) in zip(curs,curs[1:]):
  if ta<=t<tb:pointer(d,lerp(a,b,(t-ta)/(tb-ta)),any(abs(t-c)<.22 for c in [2.7,4,5.5,6.5,7.6,8.5,10.5,12,16,22,23.5]),t);break
 if 0<=t<1.8:
  panel(d,(390,225,890,470),fill=(8,16,28,245),outline='#5c8098',r=18)
  txt(d,(420,248),'CHOOSE YOUR SIDE',24,b=True)
  for x,label,col in [(420,'DEFENCE',CYAN),(655,'LOOTERS',ORANGE)]:
   panel(d,(x,305,x+205,395),outline=col);txt(d,(x+23,338),label,20,c=col,b=True)
  txt(d,(420,430),'Same district. Different objectives.',16,c='#adbdcc')
 if 19<t<20.8:
  panel(d,(415,225,865,385),outline=GREEN);txt(d,(450,250),'WAVE SECURED',30,c=GREEN,b=True);txt(d,(450,303),'3 STORES HELD   /   +350 BUDGET',18);txt(d,(450,340),'Next: play the attacking side',14,c='#adbdcc')
 return Image.alpha_composite(background,im).convert('RGB')
if __name__=='__main__':
 frames=ROOT/'render_frames'
 frames.mkdir(exist_ok=True)
 for i in range(FPS*SECONDS):
  t=i/FPS; frame=render(t)
  frame.save(frames/f'{i:05d}.jpg',quality=95)
  if i in [0,4*FPS,12*FPS,16*FPS,24*FPS]:frame.save(ROOT/f'preview_{int(t):02d}.jpg',quality=90)
 cmd=['ffmpeg','-y','-loglevel','error','-framerate',str(FPS),'-i',str(frames/'%05d.jpg'),'-c:v','libx264','-preset','fast','-crf','20','-pix_fmt','yuv420p','-movflags','+faststart',str(ROOT/'CITY_HOLD_gameplay_reference.mp4')]
 subprocess.run(cmd,check=True)
 shutil.rmtree(frames)
 print('Video rendered successfully')
