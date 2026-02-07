import { Check, Palette } from 'lucide-react';
import React from 'react'

const ColorPicker = ({selectedColor, onChange}) => {
    const colors=[
        {name:'Blue',value:'#3B82F6'},
        {name:'Red',value:'#EF4444'},
        {name:'Green',value:'#10B981'},
        {name:'Purple',value:'#8B5CF6'},
        {name:'Orange',value:'#F97316'},
        {name:'Teal',value:'#14B8A6'},
        {name:'Pink',value:'#EC4899'},
        {name:"Indigo",value:'#6366F1'},
        {name:"Gray",value:'#6B7280'},
        {name:"Black",value:'#1F2937'},
    ];

    const [isOpen,setIsOpen]=React.useState(false);
    const pickerRef = React.useRef(null);

    // Close on click outside
    React.useEffect(() => {
        const handleClickOutside = (event) => {
            if (pickerRef.current && !pickerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

  return (
    <div className='relative' ref={pickerRef}>
      <button className='flex items-center gap-1 text-sm text-purple-600 bg-gradient-to-br from-purple-50 to-purple-100 ring-purple-300 hover:ring  transition-all px-3 py-2 rounded-lg' onClick={()=>setIsOpen(!isOpen)}>
        <Palette size={16}/><span className='max-sm:hidden'>Accent</span>
      </button>
        {isOpen && (
            <div className='grid grid-cols-4 w-60 gap-2 absolute top-full left-0 right-0 p-3 mt-2 z-50 bg-white rounded-md border border-gray-200 shadow-lg'>
                {colors.map((color)=>(
                    <div 
                      key={color.value}
                        className='relative cursor-pointer group flex flex-col'
                        onClick={()=>{
                            onChange(color.value);
                            setIsOpen(false);
                        }}
                    >
                        <div className='w-12 h-12 rounded-full border-2 border-transparent group-hover:border-black/25 transition-colors' style={{backgroundColor:color.value}}>
                        </div>
                        {selectedColor===color.value && (
                            <div className='absolute top-0 right-0 left-0 bottom-4.5 flex items-center justify-center'>
                                <Check className='size-5 text-white'/>
                            </div>
                        )}
                        <p className='text-center text-xs mt-1 text-gray-600'>{color.name}</p>
                    </div>
                ))}
            </div>
        )}
    </div>
  )
}

export default ColorPicker
