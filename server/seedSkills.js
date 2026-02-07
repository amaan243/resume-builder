import mongoose from 'mongoose';
import 'dotenv/config';
import Skill from './models/Skill.js';

// Skills data with categories and popularity
const skillsData = [
  // Frontend Technologies
  { name: 'React', category: 'Frontend', popularity: 98 },
  { name: 'Angular', category: 'Frontend', popularity: 85 },
  { name: 'Vue.js', category: 'Frontend', popularity: 87 },
  { name: 'Next.js', category: 'Frontend', popularity: 92 },
  { name: 'Nuxt.js', category: 'Frontend', popularity: 75 },
  { name: 'Svelte', category: 'Frontend', popularity: 78 },
  { name: 'HTML5', category: 'Frontend', popularity: 95 },
  { name: 'CSS3', category: 'Frontend', popularity: 95 },
  { name: 'JavaScript', category: 'Frontend', popularity: 99 },
  { name: 'TypeScript', category: 'Frontend', popularity: 94 },
  { name: 'jQuery', category: 'Frontend', popularity: 70 },
  { name: 'Bootstrap', category: 'Frontend', popularity: 82 },
  { name: 'Tailwind CSS', category: 'Frontend', popularity: 93 },
  { name: 'Material-UI', category: 'Frontend', popularity: 85 },
  { name: 'Sass', category: 'Frontend', popularity: 80 },
  { name: 'Less', category: 'Frontend', popularity: 65 },
  { name: 'Webpack', category: 'Frontend', popularity: 83 },
  { name: 'Vite', category: 'Frontend', popularity: 88 },
  { name: 'Parcel', category: 'Frontend', popularity: 70 },
  { name: 'Redux', category: 'Frontend', popularity: 89 },
  { name: 'MobX', category: 'Frontend', popularity: 72 },
  { name: 'Zustand', category: 'Frontend', popularity: 75 },
  { name: 'Recoil', category: 'Frontend', popularity: 68 },
  { name: 'React Router', category: 'Frontend', popularity: 86 },
  { name: 'Gatsby', category: 'Frontend', popularity: 76 },
  { name: 'Remix', category: 'Frontend', popularity: 74 },
  { name: 'Astro', category: 'Frontend', popularity: 73 },
  { name: 'Emotion', category: 'Frontend', popularity: 71 },
  { name: 'Styled Components', category: 'Frontend', popularity: 79 },
  { name: 'Chakra UI', category: 'Frontend', popularity: 77 },

  // Backend Technologies
  { name: 'Node.js', category: 'Backend', popularity: 96 },
  { name: 'Express.js', category: 'Backend', popularity: 94 },
  { name: 'NestJS', category: 'Backend', popularity: 83 },
  { name: 'Fastify', category: 'Backend', popularity: 76 },
  { name: 'Koa.js', category: 'Backend', popularity: 72 },
  { name: 'Django', category: 'Backend', popularity: 88 },
  { name: 'Flask', category: 'Backend', popularity: 84 },
  { name: 'FastAPI', category: 'Backend', popularity: 86 },
  { name: 'Spring Boot', category: 'Backend', popularity: 90 },
  { name: 'Spring Framework', category: 'Backend', popularity: 87 },
  { name: 'Laravel', category: 'Backend', popularity: 85 },
  { name: 'Symfony', category: 'Backend', popularity: 74 },
  { name: 'Ruby on Rails', category: 'Backend', popularity: 80 },
  { name: 'ASP.NET Core', category: 'Backend', popularity: 86 },
  { name: 'ASP.NET MVC', category: 'Backend', popularity: 78 },
  { name: 'Phoenix', category: 'Backend', popularity: 70 },
  { name: 'Gin', category: 'Backend', popularity: 75 },
  { name: 'Echo', category: 'Backend', popularity: 72 },
  { name: 'Fiber', category: 'Backend', popularity: 71 },
  { name: 'Actix', category: 'Backend', popularity: 68 },
  { name: 'Rocket', category: 'Backend', popularity: 67 },
  { name: 'GraphQL', category: 'Backend', popularity: 87 },
  { name: 'REST API', category: 'Backend', popularity: 95 },
  { name: 'gRPC', category: 'Backend', popularity: 76 },
  { name: 'WebSocket', category: 'Backend', popularity: 79 },
  { name: 'Socket.io', category: 'Backend', popularity: 81 },
  { name: 'Microservices', category: 'Backend', popularity: 85 },
  { name: 'Serverless', category: 'Backend', popularity: 80 },
  { name: 'Lambda Functions', category: 'Backend', popularity: 78 },

  // Database Technologies
  { name: 'MongoDB', category: 'Database', popularity: 92 },
  { name: 'MySQL', category: 'Database', popularity: 91 },
  { name: 'PostgreSQL', category: 'Database', popularity: 93 },
  { name: 'Redis', category: 'Database', popularity: 88 },
  { name: 'SQLite', category: 'Database', popularity: 79 },
  { name: 'Microsoft SQL Server', category: 'Database', popularity: 84 },
  { name: 'Oracle Database', category: 'Database', popularity: 82 },
  { name: 'MariaDB', category: 'Database', popularity: 77 },
  { name: 'Cassandra', category: 'Database', popularity: 75 },
  { name: 'DynamoDB', category: 'Database', popularity: 80 },
  { name: 'Firebase', category: 'Database', popularity: 85 },
  { name: 'Supabase', category: 'Database', popularity: 78 },
  { name: 'Elasticsearch', category: 'Database', popularity: 81 },
  { name: 'Neo4j', category: 'Database', popularity: 72 },
  { name: 'CouchDB', category: 'Database', popularity: 68 },
  { name: 'InfluxDB', category: 'Database', popularity: 70 },
  { name: 'TimescaleDB', category: 'Database', popularity: 69 },
  { name: 'Prisma', category: 'Database', popularity: 83 },
  { name: 'Mongoose', category: 'Database', popularity: 86 },
  { name: 'Sequelize', category: 'Database', popularity: 79 },
  { name: 'TypeORM', category: 'Database', popularity: 80 },
  { name: 'Drizzle ORM', category: 'Database', popularity: 74 },

  // DevOps & Cloud
  { name: 'Docker', category: 'DevOps', popularity: 94 },
  { name: 'Kubernetes', category: 'DevOps', popularity: 90 },
  { name: 'AWS', category: 'DevOps', popularity: 95 },
  { name: 'Azure', category: 'DevOps', popularity: 88 },
  { name: 'Google Cloud Platform', category: 'DevOps', popularity: 87 },
  { name: 'Jenkins', category: 'DevOps', popularity: 82 },
  { name: 'GitLab CI/CD', category: 'DevOps', popularity: 84 },
  { name: 'GitHub Actions', category: 'DevOps', popularity: 89 },
  { name: 'CircleCI', category: 'DevOps', popularity: 78 },
  { name: 'Travis CI', category: 'DevOps', popularity: 72 },
  { name: 'Terraform', category: 'DevOps', popularity: 85 },
  { name: 'Ansible', category: 'DevOps', popularity: 81 },
  { name: 'Puppet', category: 'DevOps', popularity: 70 },
  { name: 'Chef', category: 'DevOps', popularity: 68 },
  { name: 'Nginx', category: 'DevOps', popularity: 86 },
  { name: 'Apache', category: 'DevOps', popularity: 80 },
  { name: 'Linux', category: 'DevOps', popularity: 92 },
  { name: 'Ubuntu', category: 'DevOps', popularity: 85 },
  { name: 'CentOS', category: 'DevOps', popularity: 75 },
  { name: 'Bash', category: 'DevOps', popularity: 83 },
  { name: 'PowerShell', category: 'DevOps', popularity: 76 },
  { name: 'Prometheus', category: 'DevOps', popularity: 79 },
  { name: 'Grafana', category: 'DevOps', popularity: 80 },
  { name: 'ELK Stack', category: 'DevOps', popularity: 78 },
  { name: 'Datadog', category: 'DevOps', popularity: 75 },
  { name: 'New Relic', category: 'DevOps', popularity: 73 },

  // Programming Languages
  { name: 'Python', category: 'Programming', popularity: 97 },
  { name: 'Java', category: 'Programming', popularity: 93 },
  { name: 'C++', category: 'Programming', popularity: 88 },
  { name: 'C#', category: 'Programming', popularity: 87 },
  { name: 'C', category: 'Programming', popularity: 82 },
  { name: 'Go', category: 'Programming', popularity: 86 },
  { name: 'Rust', category: 'Programming', popularity: 81 },
  { name: 'PHP', category: 'Programming', popularity: 84 },
  { name: 'Ruby', category: 'Programming', popularity: 79 },
  { name: 'Swift', category: 'Programming', popularity: 83 },
  { name: 'Kotlin', category: 'Programming', popularity: 85 },
  { name: 'Scala', category: 'Programming', popularity: 75 },
  { name: 'R', category: 'Programming', popularity: 76 },
  { name: 'MATLAB', category: 'Programming', popularity: 72 },
  { name: 'Perl', category: 'Programming', popularity: 65 },
  { name: 'Dart', category: 'Programming', popularity: 78 },
  { name: 'Elixir', category: 'Programming', popularity: 71 },
  { name: 'Haskell', category: 'Programming', popularity: 66 },
  { name: 'Clojure', category: 'Programming', popularity: 67 },
  { name: 'Objective-C', category: 'Programming', popularity: 70 },
  { name: 'Assembly', category: 'Programming', popularity: 64 },
  { name: 'Julia', category: 'Programming', popularity: 69 },

  // Mobile Development
  { name: 'React Native', category: 'Mobile', popularity: 90 },
  { name: 'Flutter', category: 'Mobile', popularity: 91 },
  { name: 'iOS Development', category: 'Mobile', popularity: 86 },
  { name: 'Android Development', category: 'Mobile', popularity: 89 },
  { name: 'SwiftUI', category: 'Mobile', popularity: 82 },
  { name: 'Jetpack Compose', category: 'Mobile', popularity: 80 },
  { name: 'Ionic', category: 'Mobile', popularity: 75 },
  { name: 'Xamarin', category: 'Mobile', popularity: 72 },
  { name: 'Cordova', category: 'Mobile', popularity: 68 },
  { name: 'Expo', category: 'Mobile', popularity: 84 },

  // Data Science & AI/ML
  { name: 'Machine Learning', category: 'AI/ML', popularity: 94 },
  { name: 'Deep Learning', category: 'AI/ML', popularity: 91 },
  { name: 'TensorFlow', category: 'AI/ML', popularity: 89 },
  { name: 'PyTorch', category: 'AI/ML', popularity: 90 },
  { name: 'Keras', category: 'AI/ML', popularity: 84 },
  { name: 'Scikit-learn', category: 'AI/ML', popularity: 87 },
  { name: 'Pandas', category: 'AI/ML', popularity: 92 },
  { name: 'NumPy', category: 'AI/ML', popularity: 91 },
  { name: 'Matplotlib', category: 'AI/ML', popularity: 83 },
  { name: 'Seaborn', category: 'AI/ML', popularity: 78 },
  { name: 'Computer Vision', category: 'AI/ML', popularity: 85 },
  { name: 'NLP', category: 'AI/ML', popularity: 86 },
  { name: 'OpenCV', category: 'AI/ML', popularity: 82 },
  { name: 'NLTK', category: 'AI/ML', popularity: 76 },
  { name: 'Hugging Face', category: 'AI/ML', popularity: 83 },
  { name: 'LangChain', category: 'AI/ML', popularity: 80 },
  { name: 'LLM', category: 'AI/ML', popularity: 88 },
  { name: 'GPT', category: 'AI/ML', popularity: 87 },
  { name: 'BERT', category: 'AI/ML', popularity: 79 },
  { name: 'Transformers', category: 'AI/ML', popularity: 84 },

  // Testing
  { name: 'Jest', category: 'Testing', popularity: 90 },
  { name: 'Mocha', category: 'Testing', popularity: 78 },
  { name: 'Chai', category: 'Testing', popularity: 74 },
  { name: 'Cypress', category: 'Testing', popularity: 86 },
  { name: 'Selenium', category: 'Testing', popularity: 85 },
  { name: 'Playwright', category: 'Testing', popularity: 83 },
  { name: 'Puppeteer', category: 'Testing', popularity: 79 },
  { name: 'JUnit', category: 'Testing', popularity: 87 },
  { name: 'TestNG', category: 'Testing', popularity: 76 },
  { name: 'PyTest', category: 'Testing', popularity: 84 },
  { name: 'React Testing Library', category: 'Testing', popularity: 88 },
  { name: 'Vitest', category: 'Testing', popularity: 80 },
  { name: 'Jasmine', category: 'Testing', popularity: 72 },
  { name: 'Postman', category: 'Testing', popularity: 91 },
  { name: 'Insomnia', category: 'Testing', popularity: 76 },
  { name: 'K6', category: 'Testing', popularity: 73 },
  { name: 'JMeter', category: 'Testing', popularity: 77 },

  // Version Control & Tools
  { name: 'Git', category: 'Tools', popularity: 98 },
  { name: 'GitHub', category: 'Tools', popularity: 96 },
  { name: 'GitLab', category: 'Tools', popularity: 85 },
  { name: 'Bitbucket', category: 'Tools', popularity: 79 },
  { name: 'SVN', category: 'Tools', popularity: 68 },
  { name: 'Jira', category: 'Tools', popularity: 88 },
  { name: 'Confluence', category: 'Tools', popularity: 78 },
  { name: 'Trello', category: 'Tools', popularity: 80 },
  { name: 'Asana', category: 'Tools', popularity: 75 },
  { name: 'Slack', category: 'Tools', popularity: 89 },
  { name: 'VS Code', category: 'Tools', popularity: 95 },
  { name: 'IntelliJ IDEA', category: 'Tools', popularity: 87 },
  { name: 'PyCharm', category: 'Tools', popularity: 82 },
  { name: 'WebStorm', category: 'Tools', popularity: 81 },
  { name: 'Vim', category: 'Tools', popularity: 77 },
  { name: 'Figma', category: 'Tools', popularity: 92 },
  { name: 'Adobe XD', category: 'Tools', popularity: 78 },
  { name: 'Sketch', category: 'Tools', popularity: 76 },
  { name: 'Notion', category: 'Tools', popularity: 84 },
  { name: 'Monday.com', category: 'Tools', popularity: 73 },

  // Soft Skills
  { name: 'Communication', category: 'Soft Skills', popularity: 97 },
  { name: 'Leadership', category: 'Soft Skills', popularity: 95 },
  { name: 'Team Collaboration', category: 'Soft Skills', popularity: 96 },
  { name: 'Problem Solving', category: 'Soft Skills', popularity: 98 },
  { name: 'Critical Thinking', category: 'Soft Skills', popularity: 94 },
  { name: 'Time Management', category: 'Soft Skills', popularity: 93 },
  { name: 'Project Management', category: 'Soft Skills', popularity: 91 },
  { name: 'Agile Methodologies', category: 'Soft Skills', popularity: 90 },
  { name: 'Scrum', category: 'Soft Skills', popularity: 88 },
  { name: 'Kanban', category: 'Soft Skills', popularity: 82 },
  { name: 'Mentoring', category: 'Soft Skills', popularity: 85 },
  { name: 'Public Speaking', category: 'Soft Skills', popularity: 81 },
  { name: 'Presentation Skills', category: 'Soft Skills', popularity: 86 },
  { name: 'Adaptability', category: 'Soft Skills', popularity: 92 },
  { name: 'Creative Thinking', category: 'Soft Skills', popularity: 89 },
  { name: 'Decision Making', category: 'Soft Skills', popularity: 90 },
  { name: 'Conflict Resolution', category: 'Soft Skills', popularity: 84 },
  { name: 'Negotiation', category: 'Soft Skills', popularity: 83 },
  { name: 'Emotional Intelligence', category: 'Soft Skills', popularity: 87 },
  { name: 'Work Ethic', category: 'Soft Skills', popularity: 93 },

  // Security
  { name: 'Cybersecurity', category: 'Security', popularity: 89 },
  { name: 'Penetration Testing', category: 'Security', popularity: 82 },
  { name: 'Ethical Hacking', category: 'Security', popularity: 83 },
  { name: 'OWASP', category: 'Security', popularity: 80 },
  { name: 'Authentication', category: 'Security', popularity: 88 },
  { name: 'OAuth', category: 'Security', popularity: 85 },
  { name: 'JWT', category: 'Security', popularity: 87 },
  { name: 'SSL/TLS', category: 'Security', popularity: 84 },
  { name: 'Encryption', category: 'Security', popularity: 86 },
  { name: 'Firewalls', category: 'Security', popularity: 79 },
  { name: 'VPN', category: 'Security', popularity: 78 },
  { name: 'Security Auditing', category: 'Security', popularity: 81 },

  // Others
  { name: 'Blockchain', category: 'Other', popularity: 79 },
  { name: 'Solidity', category: 'Other', popularity: 74 },
  { name: 'Web3', category: 'Other', popularity: 77 },
  { name: 'Smart Contracts', category: 'Other', popularity: 75 },
  { name: 'Cryptocurrency', category: 'Other', popularity: 73 },
  { name: 'IoT', category: 'Other', popularity: 76 },
  { name: 'Embedded Systems', category: 'Other', popularity: 78 },
  { name: 'AR/VR', category: 'Other', popularity: 75 },
  { name: 'Unity', category: 'Other', popularity: 82 },
  { name: 'Unreal Engine', category: 'Other', popularity: 80 },
  { name: 'Game Development', category: 'Other', popularity: 81 },
  { name: 'SEO', category: 'Other', popularity: 84 },
  { name: 'Digital Marketing', category: 'Other', popularity: 82 },
  { name: 'Content Management Systems', category: 'Other', popularity: 77 },
  { name: 'WordPress', category: 'Other', popularity: 83 },
  { name: 'Shopify', category: 'Other', popularity: 78 },
  { name: 'WooCommerce', category: 'Other', popularity: 74 },
  { name: 'Strapi', category: 'Other', popularity: 76 },
  { name: 'Sanity', category: 'Other', popularity: 75 },
  { name: 'Contentful', category: 'Other', popularity: 74 },
];

// Seed function
const seedSkills = async () => {
  try {
    // Connect to MongoDB with correct database name
    const mongoUri = process.env.MONGO_URI;
    const dbName = 'resume-builder';
    const connectionString = mongoUri.endsWith('/') 
      ? `${mongoUri}${dbName}` 
      : `${mongoUri}/${dbName}`;
    
    await mongoose.connect(connectionString);
    console.log('Connected to MongoDB');

    // Clear existing skills
    await Skill.deleteMany({});
    console.log('Cleared existing skills');

    // Insert new skills
    const insertedSkills = await Skill.insertMany(skillsData);
    console.log(`✅ Successfully seeded ${insertedSkills.length} skills!`);

    // Display some statistics
    const categories = await Skill.distinct('category');
    console.log(`\n📊 Categories: ${categories.join(', ')}`);
    
    for (const category of categories) {
      const count = await Skill.countDocuments({ category });
      console.log(`   - ${category}: ${count} skills`);
    }

    // Show top 10 most popular skills
    const topSkills = await Skill.find()
      .sort({ popularity: -1 })
      .limit(10)
      .select('name popularity');
    
    console.log('\n🏆 Top 10 Most Popular Skills:');
    topSkills.forEach((skill, index) => {
      console.log(`   ${index + 1}. ${skill.name} (${skill.popularity})`);
    });

    console.log('\n✨ Database seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

// Run the seed function
seedSkills();
