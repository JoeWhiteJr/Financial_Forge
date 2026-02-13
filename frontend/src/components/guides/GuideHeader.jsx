export default function GuideHeader({ icon: Icon, title, description }) {
  return (
    <div className="bg-forge-700 -mx-4 px-4 py-8 sm:-mx-6 sm:px-6 md:-mx-8 md:px-8 mb-8 rounded-lg">
      <div className="max-w-4xl">
        <div className="flex items-center gap-3 mb-2">
          {Icon && <Icon size={32} className="text-amber-400" />}
          <h1 className="text-3xl font-bold text-white">{title}</h1>
        </div>
        {description && (
          <p className="text-forge-200 text-lg ml-0">{description}</p>
        )}
      </div>
    </div>
  );
}
