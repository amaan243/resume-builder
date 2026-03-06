import { Check, Layout } from 'lucide-react';
import React from 'react'

const TemplateSelector = ({onChange, selectedTemplate}) => {

    const [isOpen,setIsOpen]=React.useState(false);
    const selectorRef = React.useRef(null);

    const templates=[
        {id:'classic',name:'Classic',preview:'A clean, traditional resume format with clear sections and professional typography.'},
        {id:'modern',name:'Modern',preview:'Sleek design with the strategic use of color and modern font choices.'},
        {id:'minimal-image',name:'Minimal with Image',preview:'Minimal design with a single image and clean typography.'},
        {id:'minimal',name:'Minimal',preview:'Ultra-clean design that puts your content front and center.'},
        {id:'swe-onepage',name:'Software Engineer One Page',preview:'Optimized single-page format for software engineers with categorized skills display.'},
    ]

    // Close on click outside
    React.useEffect(() => {
        const handleClickOutside = (event) => {
            if (selectorRef.current && !selectorRef.current.contains(event.target)) {
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
    <div className='relative' ref={selectorRef}>
      <button onClick={()=>setIsOpen(!isOpen)} className='flex items-center gap-1 text-sm text-[#1E3A8A] bg-[#60A5FA]/20 hover:bg-[#60A5FA]/30 transition-all px-3 py-2 rounded-xl'>
        <Layout size={14}/> <span className='max-sm:hidden'>Template</span>
      </button>
      {isOpen && (
        <div className='absolute top-full p-3 mt-2 w-xs space-y-3 bg-white border border-gray-200 rounded-md shadow-lg z-50'>
            {templates.map((template)=>(
              <div key={template.id} onClick={()=>{onChange(template.id);setIsOpen(false)}} className={`relative p-3 border rounded-xl cursor-pointer transition-all ${selectedTemplate===template.id ? 'border-[#1E3A8A] bg-[#60A5FA]/20':'border-[#E2E8F0] hover:border-[#CBD5F5] hover:bg-[#F8FAFC]'}`}>
                {selectedTemplate===template.id &&  (
                  <div className='absolute top-2 right-2'>
                   <div className='size-5 bg-[#1E3A8A] rounded-full flex items-center justify-center'>
                     <Check className='w-3 h-3 text-white' />
                   </div>
                </div>)}

                <div className='space-y-1'>
                    <h4 className='font-medium text-[#0F172A]'>{template.name}</h4>
                    <div className='mt-2 p-2 bg-[#60A5FA]/10 rounded-lg text-xs text-[#475569] italic'>{template.preview}</div>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  )
}

export default TemplateSelector
