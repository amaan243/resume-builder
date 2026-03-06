import React from 'react'
import { Link, useParams } from 'react-router-dom';
import {dummyResumeData} from '../assets/assets';
import {ArrowLeftIcon, Briefcase,ChevronLeft, ChevronRight, DownloadIcon, EyeIcon, EyeOffIcon, FileText, FolderIcon, GraduationCap,  Share2Icon,  Sparkles, User} from 'lucide-react'
import PersonalInfoForm from '../components/PersonalInfoForm';
import ResumePreview from '../components/ResumePreview';
import TemplateSelector from '../components/TemplateSelector';
import ColorPicker from '../components/ColorPicker';
import ProfessionalSummaryForm from '../components/ProfessionalSummaryForm';
import ExperienceForm from '../components/ExperienceForm';
import EducationForm from '../components/EducationForm';
import ProjectForm from '../components/ProjectForm';
import SkillsForm from '../components/SkillsForm';
import { useSelector } from 'react-redux';
import api from '../configs/api';
import toast from 'react-hot-toast';


const ResumeBuilder = () => {

  const { resumeId } = useParams();
  const { token } = useSelector((state) => state.auth);

  const [resumeData, setResumeData] = React.useState({
    _id: '',
    title: '',
    personal_info: {},
    professional_summary: '',
    experience: [],
    education: [],
    project: [],
    skills: [],
    template: 'classic',
    accent_color: '#3B82F6',
    public: false,
  })

  const loadExistingResume = async () => {
    try {
      const{data}=await api.get(`/api/resumes/get/`+ resumeId,{headers:{Authorization:token}});
      if(data.resume){
        // Handle backward compatibility - normalize skills into category array
        let resume = data.resume;
        if (Array.isArray(resume.skills)) {
          if (resume.skills.length > 0 && typeof resume.skills[0] === 'string') {
            resume.skills = [{ category: '', items: resume.skills }];
          }
        } else {
          resume.skills = resume.skills?.items ? [resume.skills] : [];
        }
        setResumeData(resume);
        document.title = data.resume.title;
      }
    } catch (error) {
      console.log(error.message);
      
    }
  }

  const [activeSectionIndex, setActiveSectionIndex] = React.useState(0);
  const [removeBackground, setRemoveBackground] = React.useState(false);

  const sections = [
    {id:'personal' , name: 'Personal Info',icon:User},
    {id:'summary' , name: 'Summary',icon:FileText},
    {id:'experience' , name: 'Experience',icon:Briefcase},
    {id:'education' , name: 'Education',icon:GraduationCap},
    {id:'projects' , name: 'Projects',icon:FolderIcon},
    {id:'skills' , name: 'Skills',icon:Sparkles},
  ];

  const activeSection = sections[activeSectionIndex];

  
  const changeResumeVisibility = async () => {
    try {
      const formData= new FormData();
      formData.append('resumeId',resumeId);
      formData.append('resumeData',JSON.stringify({public:!resumeData.public}));

      const{data}=await api.put(`/api/resumes/update`,formData,{headers:{Authorization:token}});
      setResumeData({...resumeData,public: !resumeData.public});
      toast.success(data.message);
    } catch (error) {
      console.error("Error updating resume visibility:", error);
      
    }
  }  

  const handelShare= () => {
    const frotendUrl=window.location.href.split('/app/')[0];
    const resumeUrl=frotendUrl+'/view/'+resumeId;

    if(navigator.share){
      navigator.share({url:resumeUrl,text:"My Resume",})
    }else{
      alert('Share not supported in this browser.')
    }
  }

  const downloadResume= () => {
    window.print();
  }

  const saveResume= async () => {
    try {
      let updatedResumeData=structuredClone(resumeData);
     
      //remove image
      if(typeof resumeData.personal_info.image === 'object' ){
        delete updatedResumeData.personal_info.image;
      }

      const formData= new FormData();
      formData.append('resumeId',resumeId);
      formData.append('resumeData',JSON.stringify(updatedResumeData));
      removeBackground && formData.append('removeBackground','yes');
      typeof resumeData.personal_info.image === 'object' && formData.append('image',resumeData.personal_info.image);

      const{data}=await api.put(`/api/resumes/update`,formData,{headers:{Authorization:token}});
      setResumeData(data.resume);
      toast.success(data.message);
    } catch (error) {
      console.error("Error saving resume:", error);
    }
  }
  

  React.useEffect(() => {

    loadExistingResume();

  }, []);
  return (
    <div>
       <div className='max-w-7xl mx-auto px-4 py-6'>
         <Link to={'/app'} className='inline-flex gap-2 items-center text-[#475569] hover:text-[#0F172A] transition-all'>
             <ArrowLeftIcon className='size-4'/> Back to Dashboard
         </Link>
       </div>
       <div className='max-w-7xl mx-auto px-4 pb-8'>
          <div className='grid lg:grid-cols-12 gap-8'>
            {/* Left Panel-form */}
            <div className='relative lg:col-span-5 rounded-lg overflow-hidden'>
               <div className='bg-white rounded-xl shadow-md border border-[#E2E8F0] p-6 pt-1'> 
                {/* Progres bar using ActiveSection */}
                <hr className='absolute top-0 left-0 right-0 border-2 border-[#E2E8F0]'/>
                <hr className='absolute top-0 left-0 h-1 bg-gradient-to-r from-[#1E3A8A] to-[#3B82F6] border-none transition-all duration-2000'
                 style={{width:`${activeSectionIndex*100 / (sections.length-1)}%`}}/>

                 {/* Section navigation */}

                 <div className='flex justify-between items-center mb-6 border-b border-[#E2E8F0] py-1'>
                     <div className='flex items-center gap-2'>
                       <TemplateSelector selectedTemplate={resumeData.template} onChange={(template) => setResumeData((prev) => ({ ...prev, template }))} />
                        <ColorPicker selectedColor={resumeData.accent_color} onChange={(color) => setResumeData((prev) => ({ ...prev, accent_color: color }))} />
                     </div>
                     <div className='flex items-center'>
                      {activeSectionIndex!==0 && (
                        <button 
                          onClick={() => setActiveSectionIndex((index) => Math.max(index-1,0))}
                          className='flex items-center gap-1 p-3 rounded-xl text-sm font-medium text-[#475569] hover:bg-[#F8FAFC] transition-all'
                           disabled={activeSectionIndex===0}>
                            <ChevronLeft className='size-4'/>Previous
                        </button>
                      )}
                      <button 
                          onClick={() => setActiveSectionIndex((index) => Math.min(index+1,sections.length-1))}
                          className={`flex items-center gap-1 p-3 rounded-xl text-sm font-medium text-[#475569] hover:bg-[#F8FAFC] transition-all ${activeSectionIndex===sections.length-1 && 'opacity-50 '}`}
                           disabled={activeSectionIndex===sections.length-1}>
                            Next <ChevronRight className='size-4'/>
                        </button>
                     </div>
                 </div>

                  {/* Active Section Form */}
                  <div className='space-y-6'>
                   { activeSection.id === 'personal' && (
                    <PersonalInfoForm 
                      data={resumeData.personal_info}
                      onChange={(updatedData) => setResumeData((prev) => ({ ...prev, personal_info: updatedData }))}
                      removeBackground={removeBackground}
                      setRemoveBackground={setRemoveBackground}
                    />

                   )}
                    { activeSection.id === 'summary' && (
                      <ProfessionalSummaryForm data={resumeData.professional_summary} onChange={(data) => setResumeData((prev) => ({ ...prev, professional_summary: data }))} setResumeData={setResumeData}/>
                    )}
                     { activeSection.id === 'experience' && (
                      <ExperienceForm data={resumeData.experience} onChange={(data) => setResumeData((prev) => ({ ...prev, experience: data }))} />
                    )}
                    { activeSection.id === 'education' && (
                      <EducationForm data={resumeData.education} onChange={(data) => setResumeData((prev) => ({ ...prev, education: data }))} />
                    )}
                    { activeSection.id === 'projects' && (
                      <ProjectForm data={resumeData.project} onChange={(data) => setResumeData((prev) => ({ ...prev, project: data }))} />
                    )}
                    { activeSection.id === 'skills' && (
                      <SkillsForm 
                        data={resumeData.skills} 
                        onChange={(data) => setResumeData((prev) => ({ ...prev, skills: data }))}
                        isSweTemplate={resumeData.template === 'swe-onepage'}
                      />
                    )}
                  </div>
                 <button onClick={()=> {toast.promise(saveResume(),{loading:'Saving...'})}} className='mt-6 px-6 py-2 text-sm bg-[#1E3A8A] text-white hover:bg-[#1E40AF] transition-all rounded-xl'>
                   Save Changes
                 </button>

               </div>
            </div>
            {/* Right Panel-preview */}
            <div className='lg:col-span-7 max-lg:mt-6'>

               
               <div className='relative w-full'>
                 <div className='absolute bottom-3 right-0 left-0  flex items-center justify-end gap-2 '>
                     {resumeData.public && (
                      <button onClick={handelShare} className='flex items-center p-2 gap-2 px-4 text-xs bg-[#60A5FA]/20 text-[#1E3A8A] rounded-xl hover:bg-[#60A5FA]/30 transition-colors'>
                        <Share2Icon className='size-4'/> Share
                      </button>
                     )}
                     <button onClick={changeResumeVisibility} className='flex items-center p-2 gap-2 px-4 text-xs bg-[#60A5FA]/20 text-[#1E3A8A] rounded-xl hover:bg-[#60A5FA]/30 transition-colors'>
                       {resumeData.public ? <EyeIcon className='size-4'/> :<EyeOffIcon className='size-4'/>}
                       {resumeData.public ? 'Public' : 'Private'}
                     </button>
                     <button onClick={downloadResume} className='flex items-center gap-2 px-6 py-2 text-xs bg-[#1E3A8A] text-white rounded-xl hover:bg-[#1E40AF] transition-colors'>
                        <DownloadIcon className='size-4'/> Download
                     </button>
                 </div>
               </div>
                <ResumePreview data={resumeData} template={resumeData.template} accentColor={resumeData.accent_color}  />
            </div>
            
          </div>
       </div>
    </div>
  )
}

export default ResumeBuilder
