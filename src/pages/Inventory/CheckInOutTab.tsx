import { useState, useMemo } from 'react';
import { db } from '../../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { LogOut, LogIn, Search, CheckCircle2, AlertCircle, X, Calendar, MapPin, Box, Folder, FolderOpen, ChevronLeft } from 'lucide-react';

export function CheckInOutTab({ pallets }: any) {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedPayload, setSelectedPayload] = useState<any>(null);
    const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());
    
    const [activeFolder, setActiveFolder] = useState<string | null>(null);
    const [destination, setDestination] = useState('');
    const [expectedBack, setExpectedBack] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    // Filter pallets based on search term
    const filteredPallets = useMemo(() => {
        if (!searchTerm) return pallets;
        return pallets.filter((p: any) => 
            p.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
            (p.name && p.name.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }, [pallets, searchTerm]);

    const folders = useMemo(() => {
        const fSet = new Set<string>();
        filteredPallets.forEach((p: any) => {
            if (p.folderName) fSet.add(p.folderName);
        });
        return Array.from(fSet).sort();
    }, [filteredPallets]);

    const handleChangeFolder = async (e: React.MouseEvent, p: any) => {
        e.stopPropagation();
        const newFolder = window.prompt("Enter a folder name to group this payload into (leave blank to remove from folder):", p.folderName || "");
        if (newFolder !== null) {
            const palletRef = doc(db, p._collection || 'pallets', p.id);
            await setDoc(palletRef, { folderName: newFolder.trim() }, { merge: true });
        }
    };

    const handleProcessEntirePayload = async (action: 'checkout' | 'checkin') => {
        if (!selectedPayload) return;
        if (action === 'checkout' && !destination) {
            alert('Please specify where this payload is going.');
            return;
        }

        setIsProcessing(true);
        try {
            // Update all items in the payload
            const updatedBoxes = selectedPayload.boxes?.map((box: any) => ({
                ...box,
                items: box.items?.map((item: any) => {
                    if (action === 'checkout') {
                        return {
                            ...item,
                            status: 'Checked Out',
                            checkedOutTo: destination,
                            expectedBack: expectedBack,
                            checkoutDate: new Date().toISOString()
                        };
                    } else {
                        return {
                            ...item,
                            status: 'In Warehouse',
                            checkedOutTo: null,
                            expectedBack: null,
                            checkoutDate: null
                        };
                    }
                })
            })) || [];

            const palletRef = doc(db, selectedPayload._collection || 'pallets', selectedPayload.id);
            const payloadUpdates: any = { boxes: updatedBoxes };
            
            if (action === 'checkout') {
                payloadUpdates.status = 'Checked Out';
                payloadUpdates.checkedOutTo = destination;
                payloadUpdates.checkoutDate = new Date().toISOString();
                payloadUpdates.zone = 'Checked Out';
                payloadUpdates.location = 'Off-site / Checked Out';
            } else {
                payloadUpdates.status = 'In Warehouse';
                payloadUpdates.checkedOutTo = null;
                payloadUpdates.checkoutDate = null;
            }

            await setDoc(palletRef, payloadUpdates, { merge: true });
            
            setSelectedPayload({
                ...selectedPayload,
                ...payloadUpdates
            });
            
            setSelectedItemIds(new Set());
            if (action === 'checkin') {
                setDestination('');
                setExpectedBack('');
            }
        } catch (err) {
            console.error('Failed to process payload:', err);
            alert('An error occurred while updating the payload.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleOpenModal = (pallet: any) => {
        setSelectedPayload(pallet);
        setSelectedItemIds(new Set());
        setDestination('');
        setExpectedBack('');
    };

    const handleCloseModal = () => {
        setSelectedPayload(null);
        setSelectedItemIds(new Set());
    };

    const toggleItemSelection = (itemId: string) => {
        const newSet = new Set(selectedItemIds);
        if (newSet.has(itemId)) {
            newSet.delete(itemId);
        } else {
            newSet.add(itemId);
        }
        setSelectedItemIds(newSet);
    };

    const toggleAllItems = (items: any[]) => {
        if (selectedItemIds.size === items.length) {
            setSelectedItemIds(new Set());
        } else {
            setSelectedItemIds(new Set(items.map(i => i.id)));
        }
    };

    const handleProcessItems = async (action: 'checkout' | 'checkin') => {
        if (!selectedPayload || selectedItemIds.size === 0) return;
        if (action === 'checkout' && !destination) {
            alert('Please specify where these items are going.');
            return;
        }

        setIsProcessing(true);
        try {
            // Clone the boxes and update the items within them
            const updatedBoxes = selectedPayload.boxes?.map((box: any) => ({
                ...box,
                items: box.items?.map((item: any) => {
                    if (selectedItemIds.has(item.id)) {
                        if (action === 'checkout') {
                            return {
                                ...item,
                                status: 'Checked Out',
                                checkedOutTo: destination,
                                expectedBack: expectedBack,
                                checkoutDate: new Date().toISOString()
                            };
                        } else {
                            return {
                                ...item,
                                status: 'In Warehouse',
                                checkedOutTo: null,
                                expectedBack: null,
                                checkoutDate: null
                            };
                        }
                    }
                    return item;
                })
            })) || [];

            // Also check if ALL items in the payload are checked out, we could update the payload status,
            // but for now let's just update the boxes.
            const palletRef = doc(db, selectedPayload._collection || 'pallets', selectedPayload.id);
            await setDoc(palletRef, { boxes: updatedBoxes }, { merge: true });
            
            // Update local state temporarily to reflect changes before snapshot updates
            setSelectedPayload({
                ...selectedPayload,
                boxes: updatedBoxes
            });
            
            setSelectedItemIds(new Set());
            setDestination('');
            setExpectedBack('');
        } catch (err) {
            console.error('Failed to process items:', err);
            alert('An error occurred while updating the items.');
        } finally {
            setIsProcessing(false);
        }
    };

    // Flatten all items from the selected payload for easy display
    const payloadItems = useMemo(() => {
        if (!selectedPayload?.boxes) return [];
        return selectedPayload.boxes.flatMap((box: any) => 
            (box.items || []).map((item: any) => ({
                ...item,
                boxName: box.name
            }))
        );
    }, [selectedPayload]);

    return (
        <div className="flex-1 flex flex-col overflow-hidden bg-[#f8f9fa] animate-in fade-in duration-300">
            {/* Header / Search */}
            <div className="p-8 border-b border-brand-border bg-white shrink-0 flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-serif font-bold text-brand-primary mb-2 flex items-center gap-2">
                        <LogOut size={24} /> Check In / Out
                    </h2>
                    <p className="text-xs font-bold uppercase tracking-widest text-brand-secondary">Select a payload to check specific items in or out</p>
                </div>
                
                <div className="relative w-full max-w-md">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search size={16} className="text-brand-secondary" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search Payloads..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-brand-bg border border-brand-border rounded-xl text-sm font-bold text-brand-primary placeholder:text-gray-400 outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all shadow-sm"
                    />
                </div>
            </div>
            
            {/* Main Grid */}
            <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
                {activeFolder && (
                    <div className="mb-6 flex items-center justify-between bg-white p-4 rounded-xl border border-brand-border shadow-sm">
                        <div className="flex items-center gap-3">
                            <button onClick={() => setActiveFolder(null)} className="p-2 hover:bg-brand-bg rounded-lg transition-colors text-brand-secondary hover:text-brand-primary">
                                <ChevronLeft size={20} />
                            </button>
                            <FolderOpen size={24} className="text-brand-primary" />
                            <h3 className="font-serif text-xl font-bold text-brand-primary">{activeFolder}</h3>
                        </div>
                    </div>
                )}

                {!activeFolder && folders.length > 0 && (
                    <div className="mb-10">
                        <h3 className="text-[10px] font-bold uppercase tracking-widest text-brand-secondary mb-4 flex items-center gap-2">
                            <Folder size={14} /> Folders
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {folders.map(folderName => {
                                const folderPallets = filteredPallets.filter((p: any) => p.folderName === folderName);
                                return (
                                    <div 
                                        key={folderName} 
                                        onClick={() => setActiveFolder(folderName)}
                                        className="bg-white border border-brand-border rounded-xl p-5 shadow-sm hover:shadow-md hover:border-brand-primary/50 transition-all cursor-pointer group flex items-center gap-4"
                                    >
                                        <div className="w-12 h-12 bg-brand-bg rounded-lg flex items-center justify-center text-brand-primary group-hover:scale-110 transition-transform">
                                            <Folder size={20} />
                                        </div>
                                        <div>
                                            <h4 className="font-serif text-lg font-bold text-brand-primary leading-tight mb-1">{folderName}</h4>
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-brand-secondary">{folderPallets.length} Payloads</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {filteredPallets.length > 0 ? (
                    <div>
                        {!activeFolder && folders.length > 0 && (
                            <h3 className="text-[10px] font-bold uppercase tracking-widest text-brand-secondary mb-4">Loose Payloads</h3>
                        )}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {filteredPallets.filter((p: any) => activeFolder ? p.folderName === activeFolder : !p.folderName).map((p: any) => {
                                // Calculate how many items are checked out vs total
                                let totalItems = 0;
                                let outItems = 0;
                                p.boxes?.forEach((b: any) => {
                                    b.items?.forEach((i: any) => {
                                        totalItems++;
                                        if (i.status === 'Checked Out') outItems++;
                                    });
                                });

                                return (
                                    <div 
                                        key={p.id} 
                                        onClick={() => handleOpenModal(p)}
                                        className="bg-white border-2 border-brand-border rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-brand-primary/50 transition-all cursor-pointer relative overflow-hidden group"
                                    >
                                        {outItems > 0 && (
                                            <div className="absolute top-0 right-0 w-16 h-16 bg-amber-50 rounded-bl-[100px] flex items-start justify-end p-3 z-0">
                                                <div className="w-3 h-3 rounded-full bg-amber-500 animate-pulse"></div>
                                            </div>
                                        )}
                                        
                                        <div className="relative z-10">
                                            <div className="flex justify-between items-start mb-3">
                                                <div className={`inline-block px-2 py-1 text-[9px] font-bold uppercase tracking-widest rounded ${outItems > 0 ? 'bg-amber-100 text-amber-700' : 'bg-brand-bg text-brand-secondary'}`}>
                                                    {p.type || 'PALLET'}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button onClick={(e) => handleChangeFolder(e, p)} className="p-1 text-brand-secondary hover:text-brand-primary hover:bg-brand-bg rounded opacity-0 group-hover:opacity-100 transition-all" title="Move to Folder">
                                                        <Folder size={14} />
                                                    </button>
                                                    {outItems > 0 && (
                                                        <span className="text-[10px] font-bold text-amber-600 bg-white px-2 py-0.5 rounded shadow-sm border border-amber-100">{outItems} OUT</span>
                                                    )}
                                                </div>
                                            </div>
                                            <h3 className="font-serif text-xl font-bold text-brand-primary mb-1 truncate">{p.name || 'Unnamed Payload'}</h3>
                                            <p className="text-[10px] font-mono text-brand-secondary mb-4">{p.id}</p>
                                            
                                            <div className="flex items-center gap-2 text-xs font-bold text-brand-secondary">
                                                <Box size={14} /> {totalItems} Total Line Items
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center max-w-md mx-auto">
                        <AlertCircle size={48} className="text-brand-secondary/50 mb-6" />
                        <h3 className="font-serif text-2xl font-bold text-brand-primary mb-3">No Payloads Found</h3>
                        <p className="text-brand-secondary text-sm leading-relaxed">
                            Could not find any inventory payloads matching your search criteria.
                        </p>
                    </div>
                )}
            </div>

            {/* Modal Dialog */}
            {selectedPayload && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col relative border border-brand-border">
                        <button onClick={handleCloseModal} className="absolute top-4 right-4 p-2 bg-brand-bg rounded-full hover:bg-gray-200 transition-colors z-10">
                            <X size={18} className="text-brand-primary" />
                        </button>
                        
                        <div className="p-6 border-b border-brand-border bg-brand-bg/30">
                            <h2 className="font-serif text-3xl font-bold text-brand-primary mb-1 pr-12">{selectedPayload.name || 'Unnamed Payload'}</h2>
                            <p className="text-xs font-bold uppercase tracking-widest text-brand-secondary">ID: {selectedPayload.id}</p>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 bg-[#f8f9fa] custom-scrollbar flex flex-col md:flex-row gap-6">
                            {/* Left Side: Items List */}
                            <div className="flex-1 flex flex-col bg-white border border-brand-border rounded-xl overflow-hidden shadow-sm">
                                <div className="p-4 border-b border-brand-border bg-brand-bg flex justify-between items-center shrink-0">
                                    <h3 className="text-xs font-bold uppercase tracking-widest text-brand-primary">Line Items</h3>
                                    <button 
                                        onClick={() => toggleAllItems(payloadItems)}
                                        className="text-[10px] font-bold uppercase text-brand-secondary hover:text-brand-primary transition-colors"
                                    >
                                        {selectedItemIds.size === payloadItems.length ? 'Deselect All' : 'Select All'}
                                    </button>
                                </div>
                                <div className="flex-1 overflow-y-auto p-2">
                                    {payloadItems.length > 0 ? (
                                        <div className="space-y-2">
                                            {payloadItems.map((item: any) => {
                                                const isSelected = selectedItemIds.has(item.id);
                                                const isOut = item.status === 'Checked Out';
                                                
                                                return (
                                                    <div 
                                                        key={item.id} 
                                                        onClick={() => toggleItemSelection(item.id)}
                                                        className={`flex items-center gap-4 p-3 rounded-lg border cursor-pointer transition-all ${isSelected ? 'bg-brand-primary/5 border-brand-primary' : 'bg-white border-brand-border hover:bg-gray-50'}`}
                                                    >
                                                        <div className={`w-5 h-5 rounded flex items-center justify-center border shrink-0 transition-colors ${isSelected ? 'bg-brand-primary border-brand-primary text-white' : 'border-gray-300'}`}>
                                                            {isSelected && <CheckCircle2 size={14} />}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex justify-between items-start mb-1">
                                                                <h4 className="font-bold text-sm text-brand-primary truncate pr-2">{item.name || 'Unknown Item'}</h4>
                                                                {isOut && (
                                                                    <span className="shrink-0 text-[9px] font-bold uppercase tracking-widest bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">OUT</span>
                                                                )}
                                                            </div>
                                                            <div className="flex flex-wrap gap-2 text-[10px] font-bold text-brand-secondary">
                                                                <span className="bg-brand-bg px-2 py-0.5 rounded">{item.boxName}</span>
                                                                {item.size && <span className="bg-brand-bg px-2 py-0.5 rounded">Size: {item.size}</span>}
                                                                <span className="bg-brand-bg px-2 py-0.5 rounded">Qty: {item.quantity || 1}</span>
                                                            </div>
                                                            {isOut && item.checkedOutTo && (
                                                                <div className="mt-2 text-[10px] text-amber-700 bg-amber-50 px-2 py-1 rounded flex flex-wrap gap-x-3 gap-y-1">
                                                                    <span className="flex items-center gap-1"><MapPin size={10} /> {item.checkedOutTo}</span>
                                                                    {item.expectedBack && <span className="flex items-center gap-1"><Calendar size={10} /> Back: {item.expectedBack}</span>}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="p-8 text-center text-brand-secondary text-sm font-bold">
                                            No items found inside this payload.
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Right Side: Action Form */}
                            <div className="w-full md:w-80 shrink-0 flex flex-col gap-4">
                                <div className="bg-white border border-brand-border rounded-xl p-5 shadow-sm">
                                    <h3 className="text-xs font-bold uppercase tracking-widest text-brand-primary mb-4 border-b pb-2">Process Action</h3>
                                    
                                    <div className="mb-4">
                                        <div className="text-[10px] font-bold uppercase tracking-widest text-brand-secondary mb-1">Selected Items</div>
                                        <div className="text-2xl font-black text-brand-primary">{selectedItemIds.size}</div>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-[10px] font-bold uppercase tracking-widest text-brand-secondary mb-1 flex items-center gap-1"><MapPin size={12}/> Where are they going?</label>
                                            <input 
                                                type="text" 
                                                value={destination}
                                                onChange={e => setDestination(e.target.value)}
                                                placeholder="Event Name / Location"
                                                className="w-full p-3 bg-brand-bg border border-brand-border rounded-lg text-sm font-bold text-brand-primary outline-none focus:border-brand-primary"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold uppercase tracking-widest text-brand-secondary mb-1 flex items-center gap-1"><Calendar size={12}/> Expected Back</label>
                                            <input 
                                                type="date" 
                                                value={expectedBack}
                                                onChange={e => setExpectedBack(e.target.value)}
                                                className="w-full p-3 bg-brand-bg border border-brand-border rounded-lg text-sm font-bold text-brand-primary outline-none focus:border-brand-primary"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <button 
                                        onClick={() => handleProcessItems('checkout')}
                                        disabled={selectedItemIds.size === 0 || isProcessing}
                                        className="w-full bg-amber-50 text-amber-600 border border-amber-200 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-amber-600 hover:text-white transition-all shadow-sm flex flex-col items-center justify-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <LogOut size={14} /> 
                                        <span>Check Out<br/>Selected</span>
                                    </button>
                                    
                                    <button 
                                        onClick={() => handleProcessItems('checkin')}
                                        disabled={selectedItemIds.size === 0 || isProcessing}
                                        className="w-full bg-emerald-50 text-emerald-600 border border-emerald-200 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all shadow-sm flex flex-col items-center justify-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <LogIn size={14} /> 
                                        <span>Check In<br/>Selected</span>
                                    </button>
                                </div>
                                
                                <div className="relative flex py-2 items-center">
                                    <div className="flex-grow border-t border-brand-border"></div>
                                    <span className="shrink-0 mx-4 text-brand-secondary text-[9px] uppercase tracking-widest font-bold">OR</span>
                                    <div className="flex-grow border-t border-brand-border"></div>
                                </div>

                                <button 
                                    onClick={() => handleProcessEntirePayload('checkout')}
                                    disabled={isProcessing}
                                    className="w-full bg-black text-white py-3 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-neutral-800 transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <LogOut size={16} /> 
                                    <span>Check Out Entire Payload</span>
                                </button>
                                
                                <button 
                                    onClick={() => handleProcessEntirePayload('checkin')}
                                    disabled={isProcessing}
                                    className="w-full bg-white text-black border border-brand-border py-3 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-neutral-100 transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <LogIn size={16} /> 
                                    <span>Check In Entire Payload</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
