import React from 'react'
import ClassicTemplate from './templates/ClassicTemplate'
import MinimalImageTemplate from './templates/MinimalImageTemplate'
import MinimalTemplate from './templates/MinimalTemplate'
import ModernTemplate from './templates/ModernTemplate'
import SoftwareEngineerOnePage from './templates/SoftwareEngineerOnePage'



const ResumePreview = ({ data, template, accentColor, classes = '' }) => {

    const renderTemplate = () => {
        switch (template) {
            case 'modern':
                return <ModernTemplate data={data} accentColor={accentColor} />;
            case 'minimal-image':
                return <MinimalImageTemplate data={data} accentColor={accentColor} />;
            case 'minimal':
                return <MinimalTemplate data={data} accentColor={accentColor} />;
            case 'swe-onepage':
                return <SoftwareEngineerOnePage data={data} accentColor={accentColor} />;
            default:
                return <ClassicTemplate data={data} accentColor={accentColor} />;
        }
    }

    return (
        <div className='w-full bg-gray-100'>
            <div id='resume-preview' className={"border border-gray-200 print:shadow-none print:border-none" + classes}>
                {renderTemplate()}
            </div>

            <style jsx>
                {`
            @page{
              size:letter;
              margin:0;
            }
            @media print {
             html, body {
                width: 8.5in;
                height: 11in;
                overflow: hidden;
             }
             html {
               -webkit-print-color-adjust: exact;
               print-color-adjust: exact;
             }
                body *{
                  visibility: hidden;
                  }
                #resume-preview, #resume-preview *{
                    visibility: visible;
                }
              
              #resume-preview{
                box-shadow:none !important;
                border:none !important;
                background: #fff !important;
                /* Scale down print output so templates fit like preview */
                zoom: 0.92;
                transform: scale(0.92);
                transform-origin: top left;
                width: calc(100% / 0.92);
                height:auto;
                position: absolute;
                left:0;
                top:0;
                margin:0;
                padding:0;
              }
            }  
          `}
            </style>

        </div>
    )
}

export default ResumePreview
