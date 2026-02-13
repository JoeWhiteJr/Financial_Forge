export default function CommandCard({ command }) {
  const { command: cmd, name, description, category, when_to_use, related_commands } = command;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md hover:border-amber-300 transition-all">
      <div className="flex items-start justify-between gap-3 mb-3">
        <h3 className="font-bold text-forge-700 font-mono text-lg">
          {cmd}{name ? ` \u2014 ${name}` : ''}
        </h3>
        {category && (
          <span className="shrink-0 text-xs font-medium bg-forge-500 text-white px-2.5 py-1 rounded-full">
            {category}
          </span>
        )}
      </div>

      {description && (
        <p className="text-gray-600 text-sm leading-relaxed mb-3">{description}</p>
      )}

      {when_to_use && (
        <div className="mb-3">
          <h4 className="text-xs font-semibold text-forge-700 uppercase tracking-wide mb-1">
            When to use
          </h4>
          <p className="text-gray-500 text-sm">{when_to_use}</p>
        </div>
      )}

      {related_commands && related_commands.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-gray-100">
          <span className="text-xs text-gray-400 mr-1 self-center">Related:</span>
          {related_commands.map((rc) => (
            <span
              key={rc}
              className="text-xs font-mono bg-gray-100 text-forge-600 px-2 py-0.5 rounded"
            >
              {rc}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
