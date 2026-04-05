// CertificateTemplate.tsx
import { Document, Page, Text, View, Image } from '@react-pdf/renderer';

// Map CSS font families to PDF-compatible families.
// PDF supports only a small set of built-in fonts, so we map designer fonts to the closest available fallback.
const getPdfFontFamily = (fontFamily?: string): string => {
  if (!fontFamily) return 'Helvetica';
  const lower = fontFamily.toLowerCase();
  if (lower.includes('times') || lower.includes('palatino') || lower.includes('garamond')) return 'Times-Roman';
  if (lower.includes('courier') || lower.includes('mono')) return 'Courier';
  if (
    lower.includes('arial') ||
    lower.includes('helvetica') ||
    lower.includes('verdana') ||
    lower.includes('tahoma') ||
    lower.includes('impact') ||
    lower.includes('comic') ||
    lower.includes('trebuchet')
  ) {
    return 'Helvetica';
  }
  return 'Helvetica';
};

export const CertificatePDF = ({ cert }: { cert: any }) => {
  // Guard against null cert or missing config
  if (!cert || !cert.templateConfig) {
    return (
      <Document>
        <Page size="A4">
          <Text>Loading...</Text>
        </Page>
      </Document>
    );
  }

  const { templateConfig, participantId, eventId, certificateId } = cert;
  const elements = templateConfig.elements || [];

  const getPageStyle = () => ({
    width: templateConfig.width || 842,
    height: templateConfig.height || 595,
    position: 'relative' as const,
    backgroundColor: '#ffffff',
    overflow: 'hidden' as const,
  });

  const getProcessedText = (el: any): string => {
    let content = el.content || '';
    if (el.field === 'name') content = participantId?.name || '';
    else if (el.field === 'event') content = eventId?.name || '';
    else if (el.field === 'date') {
      content = new Date(eventId?.date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } else if (el.field === 'certificateId') content = certificateId || '';
    else if (el.field === 'collegeName') content = participantId?.collegeName || '';
    else if (el.field === 'registrationNumber') content = participantId?.registrationNumber || '';
    else if (el.field === 'position') content = cert.position || '';
    else if (el.field === 'email') content = participantId?.email || '';

    if (el.textTransform === 'uppercase') content = content.toUpperCase();
    else if (el.textTransform === 'lowercase') content = content.toLowerCase();

    return content;
  };

  // Check if element has rich text segments
  const hasRichTextSegments = (el: any): boolean => {
    return Array.isArray(el.richTextSegments) && el.richTextSegments.length > 0;
  };

  // Get style for a rich text segment
  const getRichTextStyle = (segment: any, baseEl: any) => {
    const fontFamily = getPdfFontFamily(segment.fontFamily || baseEl.fontFamily);
    const isBold = segment.isBold !== undefined ? segment.isBold : (baseEl.isBold || baseEl.fontWeight === 'bold');
    const isItalic = segment.isItalic !== undefined ? segment.isItalic : (baseEl.isItalic || baseEl.fontStyle === 'italic');

    return {
      fontSize: segment.fontSize || baseEl.fontSize || 20,
      fontFamily,
      fontWeight: isBold ? 'bold' as const : 'normal' as const,
      fontStyle: isItalic ? 'italic' as const : 'normal' as const,
      color: segment.color || baseEl.color || '#000000',
      textDecoration: (segment.isUnderline || baseEl.isUnderline) ? 'underline' as const : 'none' as const,
    };
  };

  const getTextStyle = (el: any) => {
    const fontFamily = getPdfFontFamily(el.fontFamily);
    const isBold = el.isBold || el.fontWeight === 'bold';
    const isItalic = el.isItalic || el.fontStyle === 'italic';

    return {
      fontSize: el.fontSize || 20,
      fontFamily,
      fontWeight: isBold ? 'bold' as const : 'normal' as const,
      fontStyle: isItalic ? 'italic' as const : 'normal' as const,
      color: el.color || '#000000',
      textAlign: el.textAlign || 'left' as const,
      lineHeight: el.lineHeight || 1.2,
      letterSpacing: el.letterSpacing || 0,
      textDecoration: el.isUnderline ? 'underline' as const : 'none' as const,
    };
  };

  const getImageSource = (el: any): string | undefined => el.qrDataUrl || el.src || el.content;

  return (
    <Document>
      <Page size={[getPageStyle().width, getPageStyle().height]} style={getPageStyle()}>
        {/* Background Image */}
        {templateConfig.backgroundImage && (
          <Image
            src={templateConfig.backgroundImage}
            style={{
              position: 'absolute' as const,
              top: 0,
              left: 0,
              width: templateConfig.width,
              height: templateConfig.height,
            }}
          />
        )}

        {/* Elements */}
        {elements.map((el: any) => {
          const baseStyle: any = {
            position: 'absolute' as const,
            left: el.x || 0,
            top: el.y || 0,
            width: el.width || undefined,
            height: el.height || undefined,
            opacity: el.opacity !== undefined ? el.opacity : 1,
          };

          // Handle rotation (react-pdf supports transform)
          if (el.rotation) {
            baseStyle.transform = `rotate(${el.rotation}deg)`;
            baseStyle.transformOrigin = 'center center';
          }

          if (el.type === 'text') {
            const textBaseStyle: any = {
              position: 'absolute' as const,
              left: el.x || 0,
              top: el.y || 0,
              width: el.width || undefined,
              opacity: el.opacity !== undefined ? el.opacity : 1,
            };

            if (el.rotation) {
              textBaseStyle.transform = `rotate(${el.rotation}deg)`;
              textBaseStyle.transformOrigin = 'center center';
            }

            // If element has rich text segments, render each segment separately
            if (hasRichTextSegments(el)) {
              return (
                <View key={el.id} style={textBaseStyle}>
                  {el.richTextSegments.map((segment: any, idx: number) => {
                    let segText = segment.text || '';
                    // Substitute fields in segment text
                    if (segment.field === 'name') segText = participantId?.name || '';
                    else if (segment.field === 'event') segText = eventId?.name || '';
                    else if (segment.field === 'date') {
                      segText = new Date(eventId?.date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      });
                    } else if (segment.field === 'certificateId') segText = certificateId || '';
                    else if (segment.field === 'collegeName') segText = participantId?.collegeName || '';
                    else if (segment.field === 'registrationNumber') segText = participantId?.registrationNumber || '';
                    else if (segment.field === 'position') segText = cert.position || '';
                    else if (segment.field === 'email') segText = participantId?.email || '';

                    if (segment.textTransform === 'uppercase') segText = segText.toUpperCase();
                    else if (segment.textTransform === 'lowercase') segText = segText.toLowerCase();

                    return (
                      <Text key={idx} style={getRichTextStyle(segment, el)}>
                        {segText}
                      </Text>
                    );
                  })}
                </View>
              );
            }

            const content = getProcessedText(el);
            return (
              <View key={el.id} style={textBaseStyle}>
                <Text style={getTextStyle(el)}>{content}</Text>
              </View>
            );
          }

          // QR Code or Image
          if (el.type === 'image' || el.type === 'qrcode') {
            const imgSrc = getImageSource(el);
            if (!imgSrc) return null;

            return (
              <View key={el.id} style={baseStyle}>
                <Image
                  src={imgSrc}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain' as const,
                  }}
                />
              </View>
            );
          }

          return null;
        })}
      </Page>
    </Document>
  );
};