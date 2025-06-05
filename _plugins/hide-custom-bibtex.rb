module Jekyll
  module HideCustomBibtex
    def hideCustomBibtex(input)
	    keywords = @context.registers[:site].config['filtered_bibtex_keywords']

	    keywords.each do |keyword|
		    input = input.gsub(/^.*\b#{keyword}\b *= *\{.*$\n/, '')
	    end

      # Clean superscripts in author lists
      input = input.gsub(/^.*\bauthor\b *= *\{.*$\n/) { |line| line.gsub(/[*†‡§¶‖&^]/, '') }
      # Remove the url field
      input = input.gsub(/^\s*url\s*=\s*\{[^}]*\},?\s*$\n/m, '')

      return input
    end
  end
end

Liquid::Template.register_filter(Jekyll::HideCustomBibtex)