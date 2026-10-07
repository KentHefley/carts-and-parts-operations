import json,csv
from pathlib import Path
from reportlab.platypus import SimpleDocTemplate,Paragraph,Spacer,Table,TableStyle,Image
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib import colors
from reportlab.lib.pagesizes import landscape,letter
reports=json.loads(Path('tmp/report-build/reports.json').read_text())
styles=getSampleStyleSheet()
styles['Normal'].fontSize=9
styles['Normal'].leading=12
styles['Title'].textColor=colors.HexColor('#165BAC')
out=Path('outputs/report-samples')
for r in reports:
    doc=SimpleDocTemplate(str(out/(r['slug']+'.pdf')),pagesize=landscape(letter),rightMargin=32,leftMargin=32,topMargin=28,bottomMargin=30)
    story=[Image('docs/assets/logo-w-cart.png',width=300,height=55),Spacer(1,16),Paragraph(r['name'],styles['Title']),Paragraph('SAMPLE - Fictional orders',styles['Normal']),Paragraph('Date Entered: October 1-7, 2026 inclusive (America/Chicago)',styles['Normal']),Paragraph(r['filter'],styles['Normal']),Paragraph('Voided and Trash excluded. Amounts in USD.',styles['Normal']),Spacer(1,14)]
    headers=[Paragraph(h,styles['Normal']) for h in r['headers']]
    rows=[]
    for row in r['rows']:
        rows.append([Paragraph(str(v) if i<(3 if r.get('product') else 6) else f'${v:,.2f}',styles['Normal']) for i,v in enumerate(row)])
    widths=[140,290,125,125] if r.get('product') else ([60,134,64,60,100,110,100] if len(headers)==7 else [58,115,60,57,90,90,100,100])
    table=Table([headers]+rows,colWidths=widths,repeatRows=1)
    table.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),colors.HexColor('#E4EEFA')),('VALIGN',(0,0),(-1,-1),'TOP'),('TOPPADDING',(0,0),(-1,-1),10),('BOTTOMPADDING',(0,0),(-1,-1),10),('LINEBELOW',(0,0),(-1,0),1,colors.HexColor('#165BAC')),('LINEBELOW',(0,1),(-1,-1),.4,colors.HexColor('#D6E0EC'))]))
    story += [table,Spacer(1,18),Paragraph(f"{'Product Sales' if r.get('product') else 'Customer Sales Total' if r['slug']=='invoiced-customer' else 'Full Order Total'}: <b>${r['total']:,.2f}</b>",styles['Heading3'])]
    if r.get('product'):story.append(Paragraph('Quantity Sold: <b>30</b>. WH515PO: 20 units plus 10 units at $5.81. Sample transactions only.',styles['Normal']))
    if 'matching' in r:story.append(Paragraph(f"Matching Product Total: <b>${r['matching']:,.2f}</b>",styles['Heading3']))
    story += [Spacer(1,12),Paragraph(('Product sales = quantity x saved unit price. Unrelated items, labor and travel are excluded.' if r.get('product') else 'Order value includes item charges, labor and travel in these samples. It does not represent payment received.'),styles['Normal'])]
    if 'matching' in r:story.append(Paragraph('Matching Product Total includes matching item charges only. Each order is counted once in Full Order Total.',styles['Normal']))
    def footer(c,d):
        c.setFont('Helvetica',8);c.setFillColor(colors.HexColor('#52657D'));c.drawString(32,18,'Carts and Parts Operations - Sample report - October 7, 2026');c.drawRightString(760,18,f'Page {d.page}')
    doc.build(story,onFirstPage=footer,onLaterPages=footer)
    assert len(list(csv.reader((out/(r['slug']+'.csv')).open(encoding='utf-8-sig')))[-1])==len(r['headers'])
print('Three PDFs created; CSV column counts verified.')

