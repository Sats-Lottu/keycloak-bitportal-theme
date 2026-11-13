<#macro content>
  <#if register?? && social.providers??>
    <#assign signers = social.providers?filter(provider -> provider.providerId == "lnurl-auth" || provider.providerId == "nostr")>
    <#if signers?has_content>
      <section class="bitportal-registration" aria-labelledby="bitportal-registration-title">
        <h2 id="bitportal-registration-title">${msg("bitportalRegisterWith")}</h2>
        <ul>
          <#list signers as provider>
            <li>
              <a class="${properties.kcButtonClass!} ${properties.kcButtonSecondaryClass!}"
                 id="register-${provider.alias}" href="${provider.loginUrl}" data-once-link>
                ${provider.displayName}
              </a>
            </li>
          </#list>
        </ul>
      </section>
    </#if>
  </#if>
</#macro>
