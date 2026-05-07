import re

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Update CSS size
    content = re.sub(
        r"size:\s*\$\{printingBox\?\.type === 'items' \|\| printingBox\?\.type === 'all_boxes' \? 'letter' : '4in 6in'\};",
        r"size: ${printingBox?.type === 'items' || printingBox?.type === 'all_boxes' ? 'letter' : '3in 2in'};",
        content
    )
    
    # 2. Update CSS print-page-wrapper
    css_wrapper_old = r"""\.print-thermal-mode \.print-page-wrapper \{[\s\S]*?background: white !important;\s*\}"""
    css_wrapper_new = r""".print-thermal-mode .print-page-wrapper {
                 display: block !important;
                 position: relative !important;
                 width: 3in !important;
                 height: 2in !important;
                 page-break-after: always !important;
                 page-break-inside: avoid !important;
                 margin: 0 !important;
                 padding: 0 !important;
                 background: white !important;
             }"""
    content = re.sub(css_wrapper_old, css_wrapper_new, content)
    
    # 3. Update CSS print-label-container
    css_container_old = r"""\.print-thermal-mode \.print-label-container \{[\s\S]*?transform-origin: top left;\s*\}"""
    css_container_new = r""".print-thermal-mode .print-label-container {
                 position: absolute !important;
                 left: 0 !important;
                 top: 0 !important;
                 width: 3in !important;
                 height: 2in !important;
                 padding: 0.1in !important;
                 margin: 0 !important;
                 border: none !important;
                 box-sizing: border-box !important;
                 box-shadow: none !important;
                 transform: none !important;
             }"""
    content = re.sub(css_container_old, css_container_new, content)
    
    # 4. Update CSS @page
    content = re.sub(
        r'@page \{ size: 4in 6in portrait; margin: 0; \}',
        r'@page { size: 3in 2in; margin: 0; }',
        content
    )
    
    # 5. Box Thermal Label (6x4 -> 3x2)
    box_label_old = r"""<div className="bg-white shadow-xl p-6 border-4 border-black print-label-container my-auto print:shadow-none print:border-none print:m-0 overflow-hidden flex flex-col" style=\{\{ width: '6in', height: '4in', boxSizing: 'border-box' \}\}>[\s\S]*?<div className="text-\[7px\] font-mono leading-tight">[\s\S]*?SYS_ID: \{boxToPrint.id\}[\s\S]*?</div>[\s\S]*?</div>[\s\S]*?</div>[\s\S]*?</div>"""
    
    box_label_new = r"""<div className="bg-white shadow-xl p-3 border-2 border-black print-label-container my-auto print:shadow-none print:border-none print:m-0 overflow-hidden flex flex-col" style={{ width: '3in', height: '2in', boxSizing: 'border-box' }}>
                                        <div className="flex justify-between items-start mb-2 border-b-2 border-black pb-2 shrink-0">
                                            <div>
                                                <img src="/logo.png" alt="Catalyst" className="h-4 w-auto mb-2 grayscale" />
                                                <h1 className="font-sans text-xl font-black uppercase tracking-tighter leading-none">{printingBox.pallet.name}</h1>
                                                <p className="text-[10px] font-bold font-sans mt-0.5">PALLET ID: {printingBox.pallet.id.replace('pal_', '')}</p>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-xl font-black font-sans uppercase tracking-tighter leading-none mb-1">{boxToPrint.name}</div>
                                                <p className="text-[8px] font-bold uppercase tracking-widest bg-black text-white px-1.5 py-0.5 inline-block">BOX ID: {boxToPrint.id.replace('box_', '')}</p>
                                            </div>
                                        </div>

                                        <div className="flex gap-2 flex-1 min-h-0">
                                            <div className="flex-1 flex flex-col min-h-0">
                                                <h3 className="text-[9px] font-black uppercase tracking-widest mb-1 border-b border-black pb-0.5 shrink-0">Contents Manifest ({boxToPrint.items.reduce((s,i)=>s+i.quantity,0)} Units)</h3>
                                                <div className="space-y-1 overflow-y-auto pr-1 flex-1 pb-1 custom-scrollbar">
                                                    {boxToPrint.items.map((item, idx) => (
                                                        <div key={idx} className="flex gap-1.5 items-center p-1 border border-black/20 rounded">
                                                            {item.photoUrl && <img src={item.photoUrl} alt="Item" className="w-5 h-5 rounded object-cover grayscale border border-black/20 shrink-0" />}
                                                            <div className="flex-1 min-w-0">
                                                                <div className="font-bold text-[9px] leading-tight uppercase font-sans line-clamp-1">{item.name}</div>
                                                                <div className="text-[7px] font-bold font-mono">
                                                                    {item.sku ? `SKU: ${item.sku}` : ''} {item.size ? `| SIZE: ${item.size}` : ''}
                                                                </div>
                                                            </div>
                                                            <div className="font-black text-sm font-sans shrink-0">
                                                                ×{item.quantity}
                                                            </div>
                                                        </div>
                                                    ))}
                                                    {boxToPrint.items.length === 0 && (
                                                        <div className="p-2 border border-dashed border-black/30 text-center text-[9px] font-bold uppercase">Empty Box</div>
                                                    )}
                                                </div>
                                            </div>
                                            
                                            <div className="shrink-0 flex flex-col items-center justify-between border-l-2 border-black pl-2 w-20">
                                                <div className="flex flex-col items-center">
                                                    <div className="p-0.5 border-2 border-black bg-white mb-1">
                                                        <QRCode value={`${window.location.hostname === 'localhost' ? 'https://print-shop-os.vercel.app' : window.location.origin}/inventory/scan?p=${printingBox.pallet.id}&b=${boxToPrint.id}`} size={48} level="L" />
                                                    </div>
                                                    <p className="text-[6px] font-black uppercase tracking-widest text-center mt-0.5 w-full text-black">Scan to View Info</p>
                                                </div>
                                                <div className="w-full opacity-70">
                                                    <div className="text-[5px] font-mono leading-tight">
                                                        DATE: {new Date().toLocaleDateString()}<br/>
                                                        TIME: {new Date().toLocaleTimeString()}<br/>
                                                        SYS_ID: {boxToPrint.id}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>"""
    content = re.sub(box_label_old, box_label_new, content)

    # 6. Pallet Thermal Label (5.8x3.8 -> 3x2)
    pallet_label_old = r"""<div className="bg-white p-6 border-4 border-black print-label-container my-auto print:shadow-none print:border-none print:m-0 overflow-hidden flex flex-col" style=\{\{ width: '5\.8in', height: '3\.8in', boxSizing: 'border-box' \}\}>[\s\S]*?Scan To Register\\nItems"\}[\s\S]*?</p>[\s\S]*?</div>[\s\S]*?</div>[\s\S]*?</div>"""
    pallet_label_new = r"""<div className="bg-white p-3 border-2 border-black print-label-container my-auto print:shadow-none print:border-none print:m-0 overflow-hidden flex flex-col" style={{ width: '3in', height: '2in', boxSizing: 'border-box' }}>
                             <div className="flex justify-between items-start mb-2 border-b-2 border-black pb-2 shrink-0">
                                 <div>
                                     <img src="/logo.png" alt="Catalyst" className="h-4 w-auto mb-1.5 grayscale" />
                                     <h1 className="font-sans text-xl font-black uppercase tracking-tighter leading-none">{printingBox.pallet.name}</h1>
                                 </div>
                                 <div className="text-right">
                                     <div className="text-[10px] font-black font-sans uppercase tracking-widest bg-black text-white px-2 py-1 inline-block">{printingBox.pallet.type ? printingBox.pallet.type.toUpperCase() : "MASTER"}</div>
                                     <p className="text-[8px] font-bold uppercase tracking-widest mt-1">ID: {printingBox.pallet.id.replace('pal_', '')}</p>
                                 </div>
                             </div>

                             <div className="flex gap-2 flex-1 items-center justify-between min-h-0 pl-1">
                                 <div className="flex-1 shrink-0">
                                     <div className="text-2xl font-black font-sans tracking-tighter leading-none">
                                         {printingBox.pallet.boxes.filter((b: any) => b.name !== 'Loose Items').length > 0 
                                             ? printingBox.pallet.boxes.filter((b: any) => b.name !== 'Loose Items').length 
                                             : (printingBox.pallet.boxes.find((b: any) => b.name === 'Loose Items')?.items.reduce((s: number, i: any) => s + i.quantity, 0) || 0)}
                                     </div>
                                     <div className="text-[10px] font-black font-sans uppercase tracking-widest mt-1 border-t-2 border-black pt-1 max-w-[100px]">
                                         {printingBox.pallet.boxes.filter((b: any) => b.name !== 'Loose Items').length > 0 ? "Active Boxes Logged" : "Active Items Logged"}
                                     </div>
                                     <p className="text-[6px] font-bold uppercase tracking-widest mt-2 opacity-70">Date: {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}</p>
                                 </div>
                                 
                                 <div className="shrink-0 flex flex-col items-center justify-center border-l-2 border-black pl-3 pr-1">
                                     <div className="p-1 border-2 border-black bg-white mb-1">
                                         <QRCode value={`${window.location.hostname === 'localhost' ? 'https://print-shop-os.vercel.app' : window.location.origin}/inventory/scan?p=${printingBox.pallet.id}`} size={48} level="M" />
                                     </div>
                                     <p className="text-[7px] font-black uppercase tracking-widest text-center w-full text-black leading-tight whitespace-pre-wrap">
                                         {printingBox.pallet.boxes.filter((b: any) => b.name !== 'Loose Items').length > 0 ? "Scan To Register\nBoxes" : "Scan To Register\nItems"}
                                     </p>
                                 </div>
                             </div>
                         </div>"""
    content = re.sub(pallet_label_old, pallet_label_new, content)

    # 7. Single Item Thermal Label (4x2 -> 3x2) - only in EventsTab
    single_item_old = r"""<div className="bg-white p-6 border-4 border-black print-label-container my-auto print:shadow-none print:border-none print:m-0 overflow-hidden flex flex-col" style=\{\{ width: '4in', height: '2in', boxSizing: 'border-box' \}\}>[\s\S]*?size=\{64\} level="L" />[\s\S]*?</div>[\s\S]*?</div>[\s\S]*?</div>[\s\S]*?</div>"""
    single_item_new = r"""<div className="bg-white p-3 border-2 border-black print-label-container my-auto print:shadow-none print:border-none print:m-0 overflow-hidden flex flex-col" style={{ width: '3in', height: '2in', boxSizing: 'border-box' }}>
                                     <div className="flex justify-between items-start mb-1 border-b-2 border-black pb-1 shrink-0">
                                         <div>
                                             <h1 className="font-sans text-xl font-black uppercase tracking-tighter leading-none line-clamp-1">{printingBox.item.name}</h1>
                                             <p className="text-[8px] font-bold uppercase tracking-widest mt-0.5">SKU: {printingBox.item.sku || 'N/A'}</p>
                                         </div>
                                     </div>
        
                                     <div className="flex gap-2 flex-1 items-center justify-between min-h-0 pl-1">
                                         <div className="flex-1 shrink-0">
                                             <div className="text-[8px] font-black font-sans uppercase tracking-widest mb-0.5 opacity-70">Located In:</div>
                                             <div className="text-[11px] font-bold font-sans uppercase leading-none max-w-[120px] truncate">{printingBox.pallet.name}</div>
                                             <div className="text-[8px] font-bold font-sans uppercase mt-0.5">{printingBox.box.name}</div>
                                         </div>
                                         
                                         <div className="shrink-0 flex flex-col items-center justify-center pl-2 pr-1">
                                             <div className="p-0.5 border-2 border-black bg-white">
                                                 <QRCode value={`${window.location.hostname === 'localhost' ? 'https://print-shop-os.vercel.app' : window.location.origin}/inventory/scan?p=${printingBox.pallet.id}&b=${printingBox.box.id}&i=${printingBox.item.id}`} size={48} level="L" />
                                             </div>
                                         </div>
                                     </div>
                                 </div>"""
    content = re.sub(single_item_old, single_item_new, content)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

for filepath in ['src/pages/Inventory/EventsTab.tsx', 'src/pages/Inventory/PalletsTab.tsx', 'src/pages/Inventory/RoadCasesTab.tsx']:
    try:
        process_file(filepath)
        print(f"Processed {filepath}")
    except Exception as e:
        print(f"Failed to process {filepath}: {e}")
