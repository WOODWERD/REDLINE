/* WOODWERD standards reference for Loop and Redline Ctrl.
   Short paraphrases for checking drawings, not the published text. Always confirm against the current edition and the locally adopted code.
   Dimensions are inches. min = must meet, rec = recommended, max = must not exceed. A measure tagged with an item is checked against these. */
(function(){
const SETS=[
 {id:"ncs",name:"NCS drafting",full:"US National CAD Standard conventions (AIA layer guidelines, CSI Uniform Drawing System, plotting guidelines), as used in the WOODWERD sheet standard",note:"Items marked residential practice are standard US residential drafting, not NCS rules."},
 {id:"nkk",name:"NKBA kitchen",full:"NKBA Kitchen Planning Guidelines with Access Standards (31 guidelines; code notes refer to the 2015 IRC)",note:"Numbers follow the NKBA list. Code notes are the ones NKBA cites; confirm against the code your jurisdiction has adopted."},
 {id:"nkb",name:"NKBA bath",full:"NKBA Bath Planning Guidelines, summarized from secondary sources",note:"The official NKBA bath booklet wasn't reachable, so these are summarized from published excerpts and numbered for WOODWERD use (B1, B2…). Verify against the current NKBA booklet before relying on a number."},
 {id:"res",name:"Residential practice",full:"Common US residential planning dimensions",note:"Rules of thumb, not a published standard. Use them as a starting point and confirm with the client and local code."}
];
const I=(set,id,name,rule,o)=>Object.assign({set,id,ref:(set==="nkk"?"NKBA K":set==="nkb"?"NKBA B":set==="ncs"?"NCS ":"RES ")+id.replace(/^[A-Z]+/,""),name,rule},o||{});
const ITEMS=[
 /* ---------- NCS drafting conventions ---------- */
 I("ncs","N1","Sheet numbers","Discipline letter, sheet type, two-digit sequence: A-101. One-letter disciplines take a hyphen (A-101); two-letter ones don't (AD101). Set order G, V, C, L, S, A, I, P, M, E."),
 I("ncs","N2","Text height","Minimum 3/32 in cap height on the full-size sheet. General notes and dimensions 1/8 in, subtitles 3/16 in, titles 1/4 in. Text reads from the bottom or right of the sheet."),
 I("ncs","N3","Line weights","A deliberate hierarchy: what is cut is heaviest, what is beyond is lighter, annotation is lightest. Fine 0.18 mm hatch; thin 0.25 mm dimensions, center and hidden lines; medium 0.35 mm objects beyond; wide 0.50 mm cut walls; extra wide 0.70 mm profiles and match lines."),
 I("ncs","N4","Revision clouds","Each change is clouded and tagged with a revision delta (triangle with the revision number), listed in the title block revision table. Clouds from earlier issues come off at the next issue."),
 I("ncs","N5","Reference symbols","Section, elevation and detail markers carry drawing number over sheet number (3 over A-301), and the referenced drawing's title carries the same number, so references work both ways."),
 I("ncs","N6","Centerlines","Thin chain line (long dash, short dash) with the ℄ symbol at the end. Used for walls, openings, fixtures and equipment that are located by their center."),
 I("ncs","N7","Hidden and overhead","Thin dashed line for things hidden below the cut or above it in plan: upper cabinets, beams, soffits, roof edge on a floor plan."),
 I("ncs","N8","Hatch and break lines","Material hatches are fine-weight patterns, gray, labelled or keyed to one legend. A hatch stops at a drawn boundary; where a material or a drawing is cut short, show it with a break line (a line with a zigzag), not a raw clipped edge."),
 I("ncs","N9","Dimension strings","Strings run from detail to overall, outward, and close so they add up. Framed walls to face of stud, openings to centerline, finish-critical clearances to finished face and labelled CLR or FIN. Architectural ticks, not mixed with arrows. (Residential practice.)"),
 I("ncs","N10","Scales by drawing","Floor plans 1/4 in. Exterior elevations 1/4 or 1/8 in. Kitchen and bath plans and interior elevations 1/2 in, sharing one scale. Wall sections 3/4 in. Details 1-1/2 or 3 in. Site 1 in = 20 ft. (Residential defaults.)"),
 I("ncs","N11","Plan cut plane","Plans cut about 4 ft above the floor. Cut walls drawn wide with poché; below the cut medium; above the cut dashed thin. Doors drawn open at 90° with a thin swing arc. (Residential practice.)"),
 I("ncs","N12","Tags and schedules","Doors in circles, windows in hexagons or diamonds, keyed to a schedule. Rooms tagged name over number. Keynotes numbered with a list on the same sheet."),
 I("ncs","N13","North and datums","Plan north points up the sheet and matches on every plan; show true north too if different. Levels shown with a datum target and height (T.O. SUBFLOOR 0'-0\")."),
 I("ncs","N14","Notes and abbreviations","Notes in caps. Abbreviations in caps with no periods, from one list on the G-sheet. If an abbreviation could be read two ways, spell the word out."),
 /* ---------- NKBA kitchen ---------- */
 I("nkk","K1","Door opening","Kitchen entry at least 32 in clear (a 2'-10\" door). Access: 34 in clear.",{min:32,rec:34,recNote:"34 in for access"}),
 I("nkk","K2","Door interference","Entry doors and appliance doors must not hit each other or block a doorway when open."),
 I("nkk","K3","Work triangle","Sink, cooktop and refrigerator: each leg 4 to 9 ft, total 26 ft or less. An island or peninsula may cut a leg by no more than 12 in.",{min:48,max:108,dim:"one leg, center of front to center of front"}),
 I("nkk","K4","Separating work centers","No full-height, full-depth tall unit (oven tower, pantry, tall refrigerator side) between two primary work centers."),
 I("nkk","K5","Traffic through the triangle","No major traffic route should cross the work triangle."),
 I("nkk","K6","Work aisle","Between counter fronts, appliances or an island: at least 42 in for one cook, 48 in for more than one. Access: 60 in turning space, or 60 in between the arms of a U.",{min:42,rec:48,recNote:"48 in for two or more cooks"}),
 I("nkk","K7","Walkway","A walkway past the kitchen at least 36 in wide. Access: 42 in where two walkways meet at a right angle.",{min:36,rec:42,recNote:"42 in where two walkways meet"}),
 I("nkk","K8","Clearance behind seating","Counter edge to wall or obstruction behind a seated diner: 32 in if no one passes, 36 in to edge past, 44 in to walk past.",{min:32,rec:44,recNote:"36 in to edge past, 44 in to walk past"}),
 I("nkk","K9","Seating and knee space","24 in of counter width per seat. Knee space 18 in deep at a 30 in table, 15 in at 36 in counter height, 12 in at 42 in bar height.",{min:24,dim:"width per seat"}),
 I("nkk","K10","Sink placement","Put the main sink next to or across from the cooktop and the refrigerator. Access: 36 in wide knee space under it."),
 I("nkk","K11","Sink landing","At least 24 in of counter on one side of the main sink and 18 in on the other.",{min:18,rec:24,recNote:"24 in on one side, 18 in on the other"}),
 I("nkk","K12","Prep area","A continuous run of counter 36 in wide by 24 in deep right next to a sink.",{min:36}),
 I("nkk","K13","Dishwasher","Within 36 in of the sink's edge, with 21 in of standing room beside it. Access: 30 by 48 in clear floor.",{max:36,dim:"sink edge to dishwasher edge"}),
 I("nkk","K14","Second sink landing","3 in of counter on one side and 18 in on the other.",{min:18}),
 I("nkk","K15","Waste and recycling","At least two receptacles: one for waste near the sink, one for recycling."),
 I("nkk","K16","Refrigerator landing","15 in on the handle side, or 15 in either side of a side-by-side, or 15 in across the aisle within 48 in.",{min:15}),
 I("nkk","K17","Cooktop landing","12 in on one side and 15 in on the other. On an island or peninsula, 9 in of counter behind the cooktop too.",{min:12,rec:15,recNote:"15 in on the other side"}),
 I("nkk","K18","Cooktop clearance above","At least 24 in to a protected or noncombustible surface above. Code: 30 in to combustible or metal cabinets, unless the hood or the manufacturer allows less (IRC M1901.1).",{min:24,rec:30,recNote:"30 in to unprotected cabinets (code)"}),
 I("nkk","K19","Ventilation","Ducted hood, 150 cfm recommended. Code: at least 100 cfm ducted outdoors; makeup air over 400 cfm (IRC M1503)."),
 I("nkk","K20","Cooktop safety","No cooktop under an operable window. A fire extinguisher near the kitchen exit. No commercial appliances in a residence."),
 I("nkk","K21","Microwave height","Bottom about 3 in below the main user's shoulder, no higher than 54 in. Below the counter, bottom at least 15 in off the floor.",{max:54,dim:"floor to bottom of microwave"}),
 I("nkk","K22","Microwave landing","15 in of counter on the handle side, above, or below.",{min:15}),
 I("nkk","K23","Oven landing","15 in beside or above, or 15 in across the aisle within 48 in if the oven doesn't open into a walkway.",{min:15}),
 I("nkk","K24","Shared landing","Where two landing areas meet, use the longer one and add 12 in."),
 I("nkk","K25","Counter frontage","158 in of usable counter, 24 in deep with 15 in clear above. Access: two heights, 28–36 in and 36–45 in.",{min:158,dim:"total usable counter frontage"}),
 I("nkk","K26","Counter corners","Clip or round counter corners."),
 I("nkk","K27","Storage","Shelf and drawer frontage: 1,400 in in a kitchen under 150 sq ft, 1,700 in up to 350 sq ft, 2,000 in above that."),
 I("nkk","K28","Storage at the sink","Within 72 in of the sink centerline: 400 / 480 / 560 in of frontage for small, medium, large kitchens."),
 I("nkk","K29","Corner storage","At least one corner cabinet with a working storage device (lazy susan, blind corner pull-out)."),
 I("nkk","K30","Receptacles","GFCI on all countertop receptacles and the dishwasher. No face-up receptacles in the counter (IRC E3902)."),
 I("nkk","K31","Lighting","Task lighting at every work surface. Code: a wall switch at the entry; glazing at least 8% of the floor area (IRC R303)."),
 /* ---------- NKBA bath (secondary sources) ---------- */
 I("nkb","B1","Door opening","Bathroom door at least 32 in clear; 24 in only in older homes.",{min:32}),
 I("nkb","B2","Door swings","No door, including cabinet and shower doors, should hit a fixture or another door. Shower doors swing out of the shower."),
 I("nkb","B3","Ceiling height","At least 80 in over fixtures and at the front of the toilet, tub and shower (code).",{min:80}),
 I("nkb","B4","Clear floor in front of fixtures","30 in in front of each fixture to the opposite wall or fixture. Code floor: 21 in in front of a lavatory, toilet or tub; 24 in in front of a shower entry.",{min:21,rec:30,recNote:"30 in recommended"}),
 I("nkb","B5","Lavatory to side wall","Lavatory centerline 20 in from a side wall or tall cabinet; 15 in minimum (code).",{min:15,rec:20,recNote:"20 in recommended"}),
 I("nkb","B6","Two lavatories","Centerlines 36 in apart; 30 in minimum (code). At least 4 in between bowl edges.",{min:30,rec:36,recNote:"36 in recommended"}),
 I("nkb","B7","Lavatory height","32 to 43 in to suit the users; about 3 in below the elbow. Seated vanity 28 to 34 in.",{min:32,max:43,dim:"floor to rim"}),
 I("nkb","B8","Toilet centerline","18 in from the toilet centerline to a side wall or fixture; 15 in minimum (code).",{min:15,rec:18,recNote:"18 in recommended"}),
 I("nkb","B9","Toilet compartment","36 by 66 in recommended; 30 by 60 in code minimum.",{min:30,rec:36,recNote:"36 in wide recommended",dim:"compartment width"}),
 I("nkb","B10","Toilet paper holder","8 to 12 in in front of the bowl, about 26 in above the floor."),
 I("nkb","B11","Shower size","36 by 36 in interior recommended; 30 by 30 in code minimum (and a 30 in circle must fit).",{min:30,rec:36,recNote:"36 in recommended"}),
 I("nkb","B12","Shower seat","17 to 19 in high, at least 15 in deep, out of the spray.",{min:17,max:19,dim:"floor to seat"}),
 I("nkb","B13","Shower controls","38 to 48 in above the floor, reachable from outside the spray. Pressure-balanced or thermostatic valves (code).",{min:38,max:48,dim:"floor to control"}),
 I("nkb","B14","Tub controls","Accessible from outside the tub, between the rim and 33 in above the floor."),
 I("nkb","B15","Grab bars","Plan blocking for grab bars at the tub, shower and toilet, 33 to 36 in above the floor."),
 I("nkb","B16","Wet walls","Waterproof shower and tub walls to at least 72 in above the floor (code), and above the showerhead."),
 I("nkb","B17","Lighting and venting","Light every task area: vanity, shower and toilet. Exhaust fan ducted outdoors. GFCI on all receptacles."),
 /* ---------- residential practice ---------- */
 I("res","R1","Garage, two-car","20 by 20 ft is the bare minimum; 24 by 24 ft parks two cars with room to open doors and walk around; add 4 to 8 ft of depth for a workbench or storage.",{min:240,rec:288,recNote:"24 ft for comfortable parking",dim:"width or depth"}),
 I("res","R2","Garage doors","Single door 9 ft wide (10 ft for trucks); double door 16 ft (18 ft for full-size trucks). 7 ft tall standard, 8 ft for trucks and roof racks.",{min:108,dim:"single door width"}),
 I("res","R3","Hallways","36 in minimum clear (code floor); 42 to 48 in feels generous and helps furniture move.",{min:36,rec:42,recNote:"42 in or more feels generous"}),
 I("res","R4","Interior doors","Bedrooms and baths 2'-8\" to 2'-10\" doors; closets 2'-0\" and up; 3'-0\" where accessibility or furniture moves matter.",{min:30}),
 I("res","R5","Closet depth","Reach-in closet 24 in deep inside for hanging; walk-in 6 to 7 ft wide for hanging on both sides.",{min:24}),
 I("res","R6","Stairs","Common residential: 7-3/4 in maximum riser, 10 in minimum tread, 36 in minimum width, 6'-8\" headroom (IRC R311.7). Confirm with the adopted code."),
 I("res","R7","Kitchen island","An island needs 42 in clear on every working side (48 in for two cooks) and at least 12 in overhang at seating.",{min:42,rec:48,recNote:"48 in for two cooks"}),
];
const byId={};ITEMS.forEach(x=>byId[x.id]=x);
/* check a measured length (inches, real) against an item; returns {ok:"pass"|"warn"|"fail", text} or null */
function check(id,inches){const s=byId[id];if(!s||(s.min==null&&s.max==null&&s.rec==null))return null;
  const f=v=>{const ft=Math.floor(v/12),i=Math.round(v-ft*12);return v>=24?`${ft}'-${i}"`:`${Math.round(v*10)/10} in`};
  if(s.min!=null&&inches<s.min-0.25)return{ok:"fail",text:`${f(inches)} is under the ${f(s.min)} minimum`};
  if(s.max!=null&&inches>s.max+0.25)return{ok:"fail",text:`${f(inches)} is over the ${f(s.max)} maximum`};
  if(s.rec!=null&&inches<s.rec-0.25)return{ok:"warn",text:`${f(inches)} meets the minimum; ${s.recNote||f(s.rec)+" recommended"}`};
  return{ok:"pass",text:`${f(inches)} meets ${s.ref}`}}
window.WWSTD={SETS,ITEMS,byId,check,label:id=>{const s=byId[id];return s?`${s.ref} ${s.name}`:id}};
})();
