import React from 'react'
import { useNavigate } from 'react-router-dom'
import { FilePenLineIcon, PlusIcon, UploadCloudIcon ,TrashIcon, PencilIcon, XIcon ,UploadCloud, LoaderCircleIcon, Sparkles, MessageSquare} from "lucide-react"
import { dummyResumeData } from '../assets/assets'
import { useSelector } from 'react-redux'
import api from '../configs/api'
import toast from 'react-hot-toast'
import pdfToText from 'react-pdftotext'

const Dashboard = () => {
  const colors=['#9333ea','#d97706','#dc2626','#0284c7','#16a34a'];
  const [allResumes, setAllResumes] = React.useState([]);
  const [showCreateResume, setShowCreateResume] = React.useState(false);
  const [showUploadResume, setShowUploadResume] = React.useState(false);
  const [showInterviewPicker, setShowInterviewPicker] = React.useState(false);
  const [title, setTitle] = React.useState('');
  const [resume, setResume] = React.useState(null);
  const [editResumeId, setEditResumeId] = React.useState('');
  const[isLoading,setIsLoading]=React.useState(false);

  const { user, token } = useSelector((state) => state.auth);

  const navigate=useNavigate();

  const createResume = async(e) => {
   try {
    e.preventDefault();
    const {data}=await api.post('/api/resumes/create',{title},{headers:{Authorization:token}});
    setAllResumes([...allResumes,data.resume]);
    setShowCreateResume(false);
    setTitle('');
    navigate(`/app/builder/${data.resume._id}`);
   } catch (error) {
     toast.error(error?.response?.data?.message || error.message);
   }
  }


  const loadAllResumes = async() => {
    try {
       const {data}=await api.get('/api/users/resumes',{headers:{Authorization:token}});
        setAllResumes(data.resumes);
    } catch (error) {
      toast.error(error?.response?.data?.message || error.message);
    }
  }

  const uploadResume = async(e) => {
    e.preventDefault(); 
    setIsLoading(true);
    try {
      const resumeText=await pdfToText(resume);
      const {data}=await api.post('/api/ai/upload-resume',{title, resumeText},{headers:{Authorization:token}});
      setTitle('');
      setResume(null);
      setShowUploadResume(false);
      navigate(`/app/builder/${data.resumeId}`);
    } catch (error) {
      toast.error(error?.response?.data?.message || error.message);
    }
    setIsLoading(false);
  }

  const editTitle = async(e) => {
    try {
       e.preventDefault(); 
       const {data}=await api.put(`/api/resumes/update`,{resumeId:editResumeId , resumeData:{title}},{headers:{Authorization:token}});
        setAllResumes(allResumes.map(resume=>resume._id === editResumeId ? {...resume, title}: resume));
        setEditResumeId('');
        setTitle('');
        toast.success(data.message);
    } catch (error) {
      toast.error(error?.response?.data?.message || error.message);
    }
   
  }

  const deleteResume = async(resumeId) => {
    try {
      const confirmDelete=window.confirm("Are you sure you want to delete this resume?");
    if(confirmDelete){
      const {data}=await api.delete(`/api/resumes/delete/${resumeId}`,{headers:{Authorization:token}});
      setAllResumes(allResumes.filter(resume=>resume._id !== resumeId));
      toast.success(data.message);
    }
    } catch (error) {
      toast.error(error?.response?.data?.message || error.message);
    }
    

  }

  React.useEffect(() => {
    loadAllResumes();
  }, []);

  return (
    <div>
      <div className='max-w-7xl mx-auto px-4 py-8'>
         <p className='text-2xl font-medium mb-6 text-[#0F172A] sm:hidden'>Welcome, {user?.name}</p>
         <div className='flex gap-4'>
            <button onClick={()=>setShowCreateResume(true)} className='w-full bg-white sm:max-w-36 h-48 flex flex-col items-center justify-center rounded-xl gap-2 text-[#475569] border border-[#E2E8F0] shadow-md group hover:border-[#1E3A8A] hover:shadow-lg transition-all duration-300 cursor-pointer'> 
              <PlusIcon className='size-11 transition-all duration-300 p-2.5 bg-[#1E3A8A] text-white rounded-xl'/>
              <p className='text-sm group-hover:text-[#1E3A8A] transition-all duration-300'>Create Resume</p>
            </button>
            <button onClick={()=>setShowUploadResume(true)} className='w-full bg-white sm:max-w-36 h-48 flex flex-col items-center justify-center rounded-xl gap-2 text-[#475569] border border-[#E2E8F0] shadow-md group hover:border-[#3B82F6] hover:shadow-lg transition-all duration-300 cursor-pointer'> 
              <UploadCloudIcon className='size-11 transition-all duration-300 p-2.5 bg-[#3B82F6] text-white rounded-xl'/>
              <p className='text-sm group-hover:text-[#3B82F6] transition-all duration-300'>Upload Existing</p>
            </button>
            <button onClick={()=>navigate('/ats-checker')} className='w-full bg-white sm:max-w-36 h-48 flex flex-col items-center justify-center rounded-xl gap-2 text-[#475569] border border-[#E2E8F0] shadow-md group hover:border-[#60A5FA] hover:shadow-lg transition-all duration-300 cursor-pointer'> 
              <Sparkles className='size-11 transition-all duration-300 p-2.5 bg-[#60A5FA] text-white rounded-xl'/>
              <p className='text-sm group-hover:text-[#1E3A8A] transition-all duration-300'>Check ATS</p>
            </button>
            <button onClick={()=>setShowInterviewPicker(true)} className='w-full bg-white sm:max-w-36 h-48 flex flex-col items-center justify-center rounded-xl gap-2 text-[#475569] border border-[#E2E8F0] shadow-md group hover:border-[#1E3A8A] hover:shadow-lg transition-all duration-300 cursor-pointer'> 
              <MessageSquare className='size-11 transition-all duration-300 p-2.5 bg-[#1E3A8A] text-white rounded-xl'/>
              <p className='text-sm group-hover:text-[#1E3A8A] transition-all duration-300'>Interview Prep</p>
            </button>
         </div>
         <hr className='border-[#E2E8F0] my-6 sm:w-[445px]' />

         <div className='grid grid-cols-2 sm:flex flex-wrap gap-4'>
            {allResumes.map((resume,index)=>{
              const baseColor=colors[index % colors.length];
              return(
                <button key={index} onClick={()=>navigate(`/app/builder/${resume._id}`)} className='relative w-full sm:max-w-36 h-48 flex flex-col items-center justify-center rounded-xl gap-2 border group hover:shadow-lg transition-all duration-300 cursor-pointer shadow-md'
                 style={{background:`linear-gradient(135deg,${baseColor}10,${baseColor}40)`,borderColor:baseColor+'40'}}>
                    <FilePenLineIcon className='size-7 group-hover:scale-105 transition-all' style={{color:baseColor}}/>
                    <p className='text-sm  group-hover:scale-105 transition-all px-2 text-center' style={{color:baseColor}}>{resume.title}</p>
                    <p className='absolute bottom-1  text-[11px] text-slate-400 group-hover:text-slate-500 transition-all duration-300 px-2 text-center ' style={{color:baseColor+'90'}}>
                      Updated on {new Date(resume.updatedAt).toLocaleDateString()}
                    </p>
                    <div onClick={e=>e.stopPropagation()} className='absolute top-1 right-1 group-hover:flex items-center hidden'>
                      <MessageSquare onClick={()=>navigate(`/app/interview/${resume._id}`)} className='size-7 p-1.5 hover:bg-white/50 rounded text-slate-700 transition-colors'/>
                      <TrashIcon onClick={()=>deleteResume(resume._id)} className='size-7 p-1.5 hover:bg-white/50 rounded text-slate-700 transition-colors'/>
                      <PencilIcon onClick={()=>{setEditResumeId(resume._id);setTitle(resume.title)}} className='size-7 p-1.5 hover:bg-white/50 rounded text-slate-700 transition-colors'/>
                    </div>
                </button>
              )
            })} 
         </div>

         {
          showCreateResume && (
            <form onSubmit={createResume} onClick={()=>setShowCreateResume(false)} className='fixed inset-0 bg-black/70 backdrop-blur bg-opacity-50 z-10 flex items-center justify-center'>
               <div onClick={e=>e.stopPropagation()} className='relative bg-white border border-[#E2E8F0] shadow-lg rounded-xl w-full max-w-sm p-6'>
                  <h2 className='text-xl font-bold mb-4 text-[#0F172A]'>Create Resume </h2>
                  <input onChange={(e)=>setTitle(e.target.value)} value={title} type="text" placeholder='Enter Resume Title' className='w-full px-4 py-2 mb-4 border border-[#CBD5F5] rounded-lg focus:ring-2 focus:ring-[#1E3A8A] focus:border-[#1E3A8A]' required/>
                  <button className='w-full py-2 bg-[#1E3A8A] text-white rounded-xl hover:bg-[#1E40AF] transition-colors'>Create Resume</button>
                  <XIcon onClick={()=>{setShowCreateResume(false);setTitle('')}} className='absolute top-4 right-4 text-[#475569] hover:text-[#0F172A] cursor-pointer transition-colors'/>
               </div>
            </form>
          )
         }

         {
          showUploadResume && (
            <form onSubmit={uploadResume} onClick={()=>setShowUploadResume(false)} className='fixed inset-0 bg-black/70 backdrop-blur bg-opacity-50 z-10 flex items-center justify-center'>
               <div onClick={e=>e.stopPropagation()} className='relative bg-white border border-[#E2E8F0] shadow-lg rounded-xl w-full max-w-sm p-6'>
                  <h2 className='text-xl font-bold mb-4 text-[#0F172A]'>Upload Resume </h2>
                  <input onChange={(e)=>setTitle(e.target.value)} value={title} type="text" placeholder='Enter Resume Title' className='w-full px-4 py-2 mb-4 border border-[#CBD5F5] rounded-lg focus:ring-2 focus:ring-[#1E3A8A] focus:border-[#1E3A8A]' required/>
                   <div>
                     <label htmlFor="resume-input" className='block text-sm text-[#475569]'>
                        Select Resume File
                        <div className='flex items-center justify-center gap-2 border group text-[#475569] border-[#E2E8F0] border-dashed rounded-xl p-4 py-10 my-4 hover:border-[#1E3A8A] hover:text-[#1E3A8A] cursor-pointer transition-colors'>
                          {resume ? (
                            <p className='text-[#1E3A8A] font-medium'>{resume.name}</p>
                          ):(
                            <>
                              <UploadCloud className='size-14 stroke-1'/>
                              <p>upload resume</p>
                            </>
                          )}
                        </div>
                     </label>
                      <input id="resume-input" type="file" accept=".pdf" hidden onChange={(e)=>setResume(e.target.files[0])} />
                   </div>
                  <button disabled={isLoading} className='w-full py-2 bg-[#1E3A8A] text-white rounded-xl hover:bg-[#1E40AF] transition-colors flex items-center justify-center gap-2'>
                   {isLoading && <LoaderCircleIcon className='animate-spin size-4 text-white'/>}
                   {isLoading ? 'Uploading...' : 'Upload Resume'}
                    </button>
                  <XIcon onClick={()=>{setShowUploadResume(false);setTitle('')}} className='absolute top-4 right-4 text-[#475569] hover:text-[#0F172A] cursor-pointer transition-colors'/>
               </div>
            </form>
          )
         }

         {
          editResumeId && (
            <form onSubmit={editTitle} onClick={()=>setEditResumeId('')} className='fixed inset-0 bg-black/70 backdrop-blur bg-opacity-50 z-10 flex items-center justify-center'>
               <div onClick={e=>e.stopPropagation()} className='relative bg-white border border-[#E2E8F0] shadow-lg rounded-xl w-full max-w-sm p-6'>
                  <h2 className='text-xl font-bold mb-4 text-[#0F172A]'>Edit Resume Title</h2>
                  <input onChange={(e)=>setTitle(e.target.value)} value={title} type="text" placeholder='Enter Resume Title' className='w-full px-4 py-2 mb-4 border border-[#CBD5F5] rounded-lg focus:ring-2 focus:ring-[#1E3A8A] focus:border-[#1E3A8A]' required/>
                  <button className='w-full py-2 bg-[#1E3A8A] text-white rounded-xl hover:bg-[#1E40AF] transition-colors'>Update</button>
                  <XIcon onClick={()=>{setEditResumeId('');setTitle('')}} className='absolute top-4 right-4 text-[#475569] hover:text-[#0F172A] cursor-pointer transition-colors'/>
               </div>
            </form>
          )
         }
         {
          showInterviewPicker && (
            <div onClick={()=>setShowInterviewPicker(false)} className='fixed inset-0 bg-black/70 backdrop-blur bg-opacity-50 z-10 flex items-center justify-center'>
               <div onClick={e=>e.stopPropagation()} className='relative bg-white border border-[#E2E8F0] shadow-lg rounded-xl w-full max-w-md p-6'>
                  <h2 className='text-xl font-bold mb-4 text-[#0F172A]'>Choose a Resume</h2>
                  {allResumes.length === 0 ? (
                    <p className='text-sm text-[#475569]'>Create or upload a resume first.</p>
                  ) : (
                    <div className='space-y-2 max-h-64 overflow-y-auto pr-2'>
                      {allResumes.map((resume) => (
                        <button
                          key={resume._id}
                          onClick={() => {
                            setShowInterviewPicker(false);
                            navigate(`/app/interview/${resume._id}`);
                          }}
                          className='w-full text-left px-4 py-2 border border-[#E2E8F0] rounded-xl hover:bg-[#F8FAFC] hover:border-[#CBD5F5] transition-colors'
                        >
                          <p className='text-sm font-medium text-[#0F172A]'>{resume.title}</p>
                          <p className='text-[11px] text-[#475569]'>Updated {new Date(resume.updatedAt).toLocaleDateString()}</p>
                        </button>
                      ))}
                    </div>
                  )}
                  <div className='mt-4 flex items-center justify-between'>
                    <p className='text-xs text-[#475569]'>
                      Want to use a PDF that is not saved here?
                    </p>
                    <button
                      onClick={() => {
                        setShowInterviewPicker(false);
                        navigate('/app/interview');
                      }}
                      className='text-xs text-[#1E3A8A] hover:underline font-medium'
                    >
                      Use external PDF
                    </button>
                  </div>
                  <XIcon onClick={()=>setShowInterviewPicker(false)} className='absolute top-4 right-4 text-[#475569] hover:text-[#0F172A] cursor-pointer transition-colors'/>
               </div>
            </div>
          )
         }
      </div>
    </div>
  )
}

export default Dashboard
