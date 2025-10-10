# PickAFarm Documentation Index

Welcome to the PickAFarm documentation! This directory contains comprehensive documentation for developers, agents, and stakeholders working with the PickAFarm platform.

---

## 📚 Documentation Library

### **Strategic & Business Documentation**

| Document | Description | Audience |
|----------|-------------|----------|
| **[pickafarm-comprehensive-analysis.md](./pickafarm-comprehensive-analysis.md)** | Complete project analysis: market opportunity, technical architecture, business model, growth roadmap | Product, Business, Investors |

### **Technical Documentation**

| Document | Description | Audience |
|----------|-------------|----------|
| **[DOC_API-Endpoints-Reference.md](./DOC_API-Endpoints-Reference.md)** | Complete API reference with request/response examples, authentication, webhooks | Developers, Agents |
| **[DOC_Database-Query-Patterns.md](./DOC_Database-Query-Patterns.md)** | D1 database query patterns, geospatial queries, joins, optimization tips | Developers, Agents |
| **[DOC_Zoho-Field-Mappings.md](./DOC_Zoho-Field-Mappings.md)** | Exact Zoho CRM → D1 field mappings, transformations, quirks | Developers, Agents |
| **[DOC_Environment-Variables.md](./DOC_Environment-Variables.md)** | All required environment variables, secrets management, troubleshooting | Developers, DevOps |
| **[DOC_Map-Experience-Mobile-Optimization.md](./DOC_Map-Experience-Mobile-Optimization.md)** | Map UX strategy, mobile optimizations, lazy Google Maps loading, navigation patterns | Developers, Agents |

### **Root Documentation**

| Document | Location | Description |
|----------|----------|-------------|
| **CLAUDE.md** | `/CLAUDE.md` | Architecture overview, development commands, quick start guide |
| **schema.sql** | `/schema.sql` | Complete D1 database schema with table definitions and indexes |

---

## 🚀 Quick Start for Different Roles

### **For AI Agents Implementing Features**

1. **Read first**:
   - `CLAUDE.md` - Understand architecture and conventions
   - `DOC_API-Endpoints-Reference.md` - Know available endpoints
   - `DOC_Database-Query-Patterns.md` - Learn query patterns
   - `DOC_Zoho-Field-Mappings.md` - Zoho CRM field transformations
   - `DOC_Map-Experience-Mobile-Optimization.md` - Map UX and mobile performance

2. **Reference during work**:
   - `schema.sql` - Table structure and relationships
   - `DOC_Environment-Variables.md` - Required secrets and configuration
   - `pickafarm-comprehensive-analysis.md` - Business context and constraints

### **For New Developers**

1. **Start here**:
   - `CLAUDE.md` - Architecture overview and setup
   - `pickafarm-comprehensive-analysis.md` - Full project context

2. **Then dive into**:
   - `DOC_API-Endpoints-Reference.md` - How the API works
   - `DOC_Database-Query-Patterns.md` - Database best practices
   - `schema.sql` - Data model understanding

### **For Product/Business Team**

1. **Essential reading**:
   - `pickafarm-comprehensive-analysis.md` - Market analysis, business model, growth strategy

2. **Reference as needed**:
   - `CLAUDE.md` (Architecture section) - High-level tech overview
   - `DOC_API-Endpoints-Reference.md` (Endpoint Summary) - What the platform can do

---

## 📖 Documentation Standards

### **When to Update Documentation**

- **API changes**: Update `DOC_API-Endpoints-Reference.md`
- **Database changes**: Update `schema.sql` + `DOC_Database-Query-Patterns.md`
- **Architecture changes**: Update `CLAUDE.md`
- **Business model changes**: Update `pickafarm-comprehensive-analysis.md`
- **Map/UX changes**: Update `DOC_Map-Experience-Mobile-Optimization.md`

### **How to Update**

1. Make changes inline in the relevant `.md` file
2. Update "Last Updated" date at top of document
3. Add entry to document's changelog (if present)
4. Commit with descriptive message: `docs: update API reference with new /farms/nearby endpoint`

---

## 🔗 External References

Additional reference materials are available in `/Reference/`:

- **Cloudflare Workers**: `/Reference/workers/` - Official Cloudflare Workers documentation
- **Cloudflare D1**: `/Reference/d1/` - D1 database documentation
- **Cloudflare R2**: `/Reference/r2/` - R2 storage documentation
- **Cloudflare Pages**: `/Reference/pages/` - Pages deployment documentation

---

## ❓ FAQ

### **Q: Which doc should I read to understand the business model?**
A: `pickafarm-comprehensive-analysis.md` - See "Business Model" section.

### **Q: How do I know what API endpoints exist?**
A: `DOC_API-Endpoints-Reference.md` - Complete list with examples.

### **Q: What's the best way to query farms within a radius?**
A: `DOC_Database-Query-Patterns.md` - See "Geospatial Queries" section.

### **Q: Where do I find development commands (npm scripts)?**
A: `CLAUDE.md` - See "Development Commands" section.

### **Q: How is the database structured?**
A: `schema.sql` - Complete schema with comments. Also see `DOC_Database-Query-Patterns.md` for relationship diagrams.

### **Q: How do Zoho CRM fields map to the database?**
A: `DOC_Zoho-Field-Mappings.md` - Complete field mapping table with transformations.

### **Q: What environment variables do I need to set?**
A: `DOC_Environment-Variables.md` - All required secrets and configuration.

### **Q: What are the current strengths and weaknesses of the platform?**
A: `pickafarm-comprehensive-analysis.md` - See "Strengths & Competitive Advantages" and "Weaknesses & Risk Areas" sections.

### **Q: How does the mobile map optimization work?**
A: `DOC_Map-Experience-Mobile-Optimization.md` - See "Mobile Optimization Strategy" section for lazy Google Maps loading.

### **Q: Why don't mobile users see the interactive map immediately?**
A: Performance optimization. Mobile users see a lightweight SVG map first, then load Google Maps only when they click "Load Interactive Map". This reduces initial load time by ~3 seconds.

---

## 📝 Contributing to Documentation

When adding new documentation:

1. **Create in `/docs/` directory**
2. **Use Markdown format** (`.md`)
3. **Follow naming convention**:
   - Strategic docs: `descriptive-name.md`
   - Technical docs: `DOC_Category-Description.md`
4. **Add entry to this README** under appropriate section
5. **Include metadata** at top:
   ```markdown
   # Document Title

   **Document Version**: 1.0
   **Last Updated**: YYYY-MM-DD
   **Audience**: Who should read this
   ```

---

## 🎯 Document Quick Links

**Fastest Path to Understanding PickAFarm**:
1. Read: `CLAUDE.md` (10 min)
2. Skim: `pickafarm-comprehensive-analysis.md` (20 min)
3. Bookmark: `DOC_API-Endpoints-Reference.md` + `DOC_Database-Query-Patterns.md`

**Total time to productivity**: ~30 minutes

---

**Last Updated**: October 9, 2025
**Maintainer**: Development Team
