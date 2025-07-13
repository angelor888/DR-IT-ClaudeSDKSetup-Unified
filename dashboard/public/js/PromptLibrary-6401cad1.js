import{r as o,j as e}from"./react-vendor-5c40db96.js";import{a2 as t,Q as r,aL as i,r as f,I as b,aF as v,h as m,aE as C,K as I,O as S,am as w,ao as E,k as P,b$ as T,c0 as A,c1 as R,j as z,c2 as L}from"./mui-core-0afdb316.js";import"./charts-522bea3c.js";import"./redux-vendor-526875c2.js";import"./data-grid-3cb96f12.js";import"./date-vendor-943fa13b.js";const q=[{id:"1",title:"Professional Email Response",description:"Generate professional responses to customer inquiries",prompt:`You are a helpful customer service representative for DuetRight. Please respond to the following customer inquiry in a professional, friendly manner:

[CUSTOMER MESSAGE]

Provide a response that:
1. Acknowledges their concern
2. Provides helpful information
3. Offers next steps
4. Maintains a positive tone`,category:"email",rating:4.8,usageCount:234,tags:["customer-service","email","professional"],isFavorite:!0},{id:"2",title:"Job Description Generator",description:"Create detailed job descriptions from basic requirements",prompt:`Create a comprehensive job description for the following position:

Job Title: [TITLE]
Department: [DEPARTMENT]
Key Requirements: [REQUIREMENTS]

Include:
- Job summary
- Key responsibilities
- Required qualifications
- Preferred qualifications
- Company culture fit`,category:"content",rating:4.5,usageCount:156,tags:["hiring","content","job-description"]},{id:"3",title:"Customer Sentiment Analyzer",description:"Analyze customer message sentiment and suggest appropriate response tone",prompt:`Analyze the sentiment of the following customer message and provide:
1. Overall sentiment (positive/neutral/negative)
2. Key emotions detected
3. Urgency level (1-5)
4. Recommended response approach

Customer Message: [MESSAGE]`,category:"analysis",rating:4.7,usageCount:189,tags:["sentiment","analysis","customer-service"]}],F=[{id:"all",label:"All Prompts"},{id:"email",label:"Email"},{id:"content",label:"Content Creation"},{id:"analysis",label:"Analysis"},{id:"customer_service",label:"Customer Service"}],D=()=>{const[u]=o.useState(q),[a,p]=o.useState(""),[l,x]=o.useState("all"),[c,d]=o.useState(null),h=u.filter(s=>{const n=s.title.toLowerCase().includes(a.toLowerCase())||s.description.toLowerCase().includes(a.toLowerCase())||s.tags.some(j=>j.toLowerCase().includes(a.toLowerCase())),y=l==="all"||s.category===l;return n&&y}),g=s=>{navigator.clipboard.writeText(s.prompt),d(s.id),setTimeout(()=>d(null),2e3)};return e.jsxs(t,{sx:{p:3},children:[e.jsxs(t,{sx:{mb:4},children:[e.jsx(r,{variant:"h4",gutterBottom:!0,sx:{fontWeight:"bold"},children:"Prompt Library"}),e.jsx(r,{variant:"body1",color:"text.secondary",children:"Save and share effective prompts with your team"})]}),e.jsxs(t,{sx:{mb:3},children:[e.jsxs(i,{container:!0,spacing:2,alignItems:"center",children:[e.jsx(i,{size:{xs:12,md:8},children:e.jsx(f,{fullWidth:!0,placeholder:"Search prompts...",value:a,onChange:s=>p(s.target.value),InputProps:{startAdornment:e.jsx(b,{position:"start",children:e.jsx(v,{})})}})}),e.jsx(i,{size:{xs:12,md:4},children:e.jsx(m,{fullWidth:!0,variant:"contained",startIcon:e.jsx(C,{}),sx:{height:"56px"},children:"Create New Prompt"})})]}),e.jsx(I,{value:l,onChange:(s,n)=>x(n),sx:{mt:2},children:F.map(s=>e.jsx(S,{label:s.label,value:s.id},s.id))})]}),e.jsx(i,{container:!0,spacing:3,children:h.map(s=>e.jsx(i,{size:{xs:12,md:6},children:e.jsx(w,{sx:{height:"100%"},children:e.jsxs(E,{children:[e.jsxs(t,{sx:{display:"flex",justifyContent:"space-between",alignItems:"flex-start",mb:2},children:[e.jsx(r,{variant:"h6",children:s.title}),e.jsx(P,{size:"small",children:s.isFavorite?e.jsx(T,{color:"error"}):e.jsx(A,{})})]}),e.jsx(r,{variant:"body2",color:"text.secondary",sx:{mb:2},children:s.description}),e.jsx(t,{sx:{p:2,bgcolor:"grey.100",borderRadius:1,mb:2,maxHeight:150,overflow:"auto",fontFamily:"monospace",fontSize:"0.875rem",whiteSpace:"pre-wrap"},children:s.prompt}),e.jsxs(t,{sx:{display:"flex",alignItems:"center",gap:2,mb:2},children:[e.jsxs(t,{sx:{display:"flex",alignItems:"center"},children:[e.jsx(R,{value:s.rating,precision:.1,size:"small",readOnly:!0}),e.jsxs(r,{variant:"body2",sx:{ml:1},children:["(",s.rating,")"]})]}),e.jsxs(r,{variant:"body2",color:"text.secondary",children:["Used ",s.usageCount," times"]})]}),e.jsx(t,{sx:{display:"flex",gap:.5,flexWrap:"wrap",mb:2},children:s.tags.map(n=>e.jsx(z,{label:n,size:"small",variant:"outlined"},n))}),e.jsx(m,{fullWidth:!0,variant:"outlined",startIcon:e.jsx(L,{}),onClick:()=>g(s),color:c===s.id?"success":"primary",children:c===s.id?"Copied!":"Copy Prompt"})]})})},s.id))})]})};export{D as PromptLibrary};
//# sourceMappingURL=PromptLibrary-6401cad1.js.map
